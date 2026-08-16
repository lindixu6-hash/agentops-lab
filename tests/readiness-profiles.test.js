import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { runAction } from "../action/index.js";
import {
  evaluateProfile,
  loadProfile,
  validateProfile
} from "../action/profiles.js";
import { scoreCard } from "../bin/agentic-score.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function readJson(relativePath) {
  return JSON.parse(
    fs.readFileSync(path.join(projectRoot, relativePath), "utf8")
  );
}

function runProfile(card, profile, extraEnv = {}) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-profile-"));
  const output = path.join(temp, "output.txt");
  fs.writeFileSync(
    path.join(temp, "agent-card.json"),
    JSON.stringify(card),
    "utf8"
  );
  try {
    return {
      result: runAction({
        cwd: temp,
        env: {
          INPUT_CARD: "agent-card.json",
          INPUT_PROFILE: profile,
          GITHUB_OUTPUT: output,
          ...extraEnv
        },
        log: () => {}
      }),
      output: fs.readFileSync(output, "utf8")
    };
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

test("catalog defines the three risk profiles with complete policies", () => {
  const catalog = readJson("profiles/readiness-profiles.json");

  assert.equal(catalog.version, 1);
  assert.deepEqual(Object.keys(catalog.profiles).sort(), [
    "draft-only",
    "read-only",
    "state-changing"
  ]);
  for (const [name, profile] of Object.entries(catalog.profiles)) {
    assert.equal(validateProfile(profile, name), profile);
    assert.ok(Number.isInteger(profile.minimum_total));
    assert.ok(Object.keys(profile.minimum_areas).length > 0);
    assert.ok(profile.allowed_tool_effects.length > 0);
    assert.ok(profile.required_tool_effects.length > 0);
    assert.match(profile.approval_requirement, /^(none|external_state)$/);
    assert.match(profile.launch_blocker_policy, /^(allow|fail)$/);
  }
});

test("read-only example passes its exact profile boundary", () => {
  const card = readJson("examples/read-only-agent.card.json");
  const { result, output } = runProfile(card, "read-only");

  assert.equal(result.total, 14);
  assert.equal(result.profile.name, "read-only");
  assert.equal(result.profile.passed, true);
  assert.equal(result.passed, true);
  assert.match(output, /profile=read-only/);
  assert.match(output, /profile-passed=true/);
});

test("profile total and per-area boundaries fail closed", () => {
  const card = readJson("examples/read-only-agent.card.json");
  const profile = loadProfile("read-only");
  const belowTotal = structuredClone(card);
  belowTotal.scorecard.documentation = 0;
  belowTotal.scorecard.memory = 0;
  const totalResult = evaluateProfile(
    belowTotal,
    scoreCard(belowTotal),
    "read-only",
    profile
  );

  assert.equal(totalResult.totalPassed, false);
  assert.equal(totalResult.passed, false);

  const belowArea = structuredClone(card);
  belowArea.scorecard.tool_permissions = 1;
  belowArea.scorecard.memory = 2;
  const areaResult = evaluateProfile(
    belowArea,
    scoreCard(belowArea),
    "read-only",
    profile
  );

  assert.equal(areaResult.totalPassed, true);
  assert.deepEqual(areaResult.areaFailures, [
    { area: "tool_permissions", actual: 1, minimum: 2 }
  ]);
  assert.equal(areaResult.passed, false);
});

test("draft-only profile rejects external-state capability", () => {
  const card = readJson("examples/support-agent.card.json");
  card.scorecard = Object.fromEntries(
    Object.keys(card.scorecard).map((area) => [area, 2])
  );
  card.launch_blockers = [];
  card.tools.push({
    name: "send_reply",
    purpose: "Send a reply",
    access: "write",
    effect: "external_state",
    approval_required: true
  });

  assert.throws(
    () => runProfile(card, "draft-only"),
    /profile draft-only disallows tool effect\(s\): send_reply/
  );
});

test("state-changing profile requires approval on every external effect", () => {
  const card = readJson("examples/operations-agent.card.json");
  card.scorecard = Object.fromEntries(
    Object.keys(card.scorecard).map((area) => [area, 2])
  );
  card.launch_blockers = [];
  card.tools.find(
    (tool) => tool.name === "apply_production_change"
  ).approval_required = false;

  assert.throws(
    () => runProfile(card, "state-changing"),
    /requires approval for: apply_production_change/
  );
});

test("profiles require the tool effect implied by their risk tier", () => {
  const card = readJson("examples/read-only-agent.card.json");
  card.risk_profile = "state-changing";
  card.scorecard = Object.fromEntries(
    Object.keys(card.scorecard).map((area) => [area, 2])
  );
  card.tools = card.tools.map((tool) => ({
    ...tool,
    effect: "draft"
  }));

  assert.throws(
    () => runProfile(card, "state-changing"),
    /requires tool effect\(s\): external_state/
  );
});

test("profile blocker policy and explicit blocker input are both enforced", () => {
  const draft = readJson("examples/support-agent.card.json");
  draft.scorecard = Object.fromEntries(
    Object.keys(draft.scorecard).map((area) => [area, 2])
  );

  assert.throws(
    () => runProfile(draft, "draft-only"),
    /2 launch blocker\(s\) remain/
  );

  const readOnly = readJson("examples/read-only-agent.card.json");
  readOnly.launch_blockers = ["Needs private-data boundary tests"];
  assert.equal(runProfile(readOnly, "read-only").result.passed, true);
  assert.throws(
    () =>
      runProfile(readOnly, "read-only", {
        "INPUT_FAIL-ON-BLOCKERS": "true"
      }),
    /1 launch blocker\(s\) remain/
  );
});

test("unknown, malformed, and incomplete profiles fail closed", () => {
  const card = readJson("examples/read-only-agent.card.json");
  assert.throws(
    () => runProfile(card, "unknown"),
    /Unknown readiness profile: unknown/
  );

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "profile-catalog-"));
  const catalogPath = path.join(temp, "profiles.json");
  const catalog = readJson("profiles/readiness-profiles.json");
  delete catalog.profiles["read-only"].minimum_total;
  fs.writeFileSync(catalogPath, JSON.stringify(catalog), "utf8");
  try {
    assert.throws(
      () =>
        runAction({
          cwd: projectRoot,
          profileCatalogPath: catalogPath,
          env: {
            INPUT_CARD: "examples/read-only-agent.card.json",
            INPUT_PROFILE: "read-only"
          },
          log: () => {}
        }),
      /Profile read-only is missing: minimum_total/
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }

  delete card.tools[0].effect;
  assert.throws(
    () => runProfile(card, "read-only"),
    /tools\[0\]\.effect must be one of/
  );
});

test("selected profile must match Agent Card metadata", () => {
  const card = readJson("examples/read-only-agent.card.json");

  assert.throws(
    () => runProfile(card, "draft-only"),
    /risk_profile read-only does not match selected profile draft-only/
  );
});

test("examples map one unchanged scorecard to each profile", () => {
  const examples = [
    ["examples/read-only-agent.card.json", "read-only", 14],
    ["examples/support-agent.card.json", "draft-only", 12],
    ["examples/operations-agent.card.json", "state-changing", 15]
  ];

  for (const [file, expectedProfile, expectedScore] of examples) {
    const card = readJson(file);
    assert.equal(card.risk_profile, expectedProfile);
    assert.equal(scoreCard(card).total, expectedScore);
  }
});

test("profile schema and bilingual docs expose the same contract", () => {
  const schema = readJson("schema/readiness-profiles.schema.json");
  const english = fs.readFileSync(
    path.join(projectRoot, "profiles/README.md"),
    "utf8"
  );
  const chinese = fs.readFileSync(
    path.join(projectRoot, "profiles/README.zh-CN.md"),
    "utf8"
  );

  assert.equal(schema.properties.version.const, 1);
  assert.deepEqual(
    schema.$defs.profile.properties.approval_requirement.enum,
    ["none", "external_state"]
  );
  assert.match(english, /threat|failure costs/i);
  assert.match(english, /Tradeoff:/);
  assert.match(chinese, /失败成本/);
  assert.match(chinese, /取舍：/);
  assert.match(english, /README\.zh-CN\.md/);
  assert.match(chinese, /\[English\]\(README\.md\)/);
});
