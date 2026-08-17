import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  AGENT_CARD_SCHEMA_URL,
  CHECKOUT_ACTION_SHA,
  PROFILES,
  initStarter,
  parseArgs,
  starterCard,
  starterWorkflow
} from "../bin/agentic-init.js";
import { SCORE_AREAS, scoreCard } from "../bin/agentic-score.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

test("init arguments default safely and validate profile and name", () => {
  assert.deepEqual(parseArgs(["node", "agentic-init"]), {
    profile: "read-only",
    name: "Starter Agent",
    force: false,
    help: false
  });
  assert.deepEqual(
    parseArgs([
      "node",
      "agentic-init",
      "--profile",
      "draft-only",
      "--name",
      " Support Agent ",
      "--force"
    ]),
    {
      profile: "draft-only",
      name: "Support Agent",
      force: true,
      help: false
    }
  );
  assert.throws(
    () =>
      parseArgs([
        "node",
        "agentic-init",
        "--profile",
        "fully-autonomous"
      ]),
    /--profile must be one of/
  );
  assert.throws(
    () => parseArgs(["node", "agentic-init", "--name", ""]),
    /--name cannot be empty/
  );
  assert.throws(
    () => parseArgs(["node", "agentic-init", "--unknown"]),
    /Unknown argument/
  );
});

test("every profile creates a zero-score card with matching capability", () => {
  const expectedEffect = {
    "read-only": "read_only",
    "draft-only": "draft",
    "state-changing": "external_state"
  };

  for (const profile of PROFILES) {
    const card = starterCard({ profile, name: `${profile} starter` });

    assert.equal(card.$schema, AGENT_CARD_SCHEMA_URL);
    assert.equal(card.risk_profile, profile);
    assert.equal(card.tools.length, 1);
    assert.equal(card.tools[0].effect, expectedEffect[profile]);
    assert.equal(
      card.tools[0].approval_required,
      profile === "state-changing"
    );
    assert.equal(scoreCard(card).total, 0);
    assert.deepEqual(Object.keys(card.scorecard), SCORE_AREAS);
    assert.ok(card.launch_blockers[0].includes("Starter card"));
    assert.match(JSON.stringify(card), /TODO/);
  }
});

test("generated workflow pins public v0 and fails on blockers", () => {
  for (const profile of PROFILES) {
    const workflow = starterWorkflow({ profile });

    assert.match(
      workflow,
      /uses: lindixu6-hash\/awesome-agentic-engineering@v0/
    );
    assert.match(
      workflow,
      new RegExp(`uses: actions/checkout@${CHECKOUT_ACTION_SHA} # v7\\.0\\.1`)
    );
    assert.doesNotMatch(workflow, /uses: actions\/checkout@v\d/);
    assert.match(workflow, new RegExp(`profile: "${profile}"`));
    assert.match(workflow, /fail-on-blockers: "true"/);
    assert.match(workflow, /permissions:\n  contents: read/);
    assert.match(workflow, /workflow_dispatch:/);
  }
});

test("downloadable starters are byte-equivalent to initializer output", () => {
  for (const profile of PROFILES) {
    const directory = path.join(projectRoot, "starters", profile);
    const card = fs.readFileSync(
      path.join(directory, "agent-card.json"),
      "utf8"
    );
    const workflow = fs.readFileSync(
      path.join(directory, "agent-readiness.yml"),
      "utf8"
    );

    assert.equal(
      card,
      `${JSON.stringify(
        starterCard({ profile, name: "Starter Agent" }),
        null,
        2
      )}\n`
    );
    assert.equal(workflow, starterWorkflow({ profile }));

    const parsed = JSON.parse(card);
    assert.equal(scoreCard(parsed).total, 0);
    assert.equal(parsed.launch_blockers.length, 1);
    assert.match(workflow, /fail-on-blockers: "true"/);
  }
});

test("initializer writes both files and refuses partial overwrite", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-init-"));
  try {
    fs.writeFileSync(path.join(temp, "README.md"), "keep me\n", "utf8");
    const options = {
      profile: "draft-only",
      name: "Support Drafting Agent",
      force: false
    };
    const created = initStarter(options, temp);
    const card = JSON.parse(fs.readFileSync(created.cardPath, "utf8"));
    const workflow = fs.readFileSync(created.workflowPath, "utf8");

    assert.equal(card.name, "Support Drafting Agent");
    assert.equal(card.risk_profile, "draft-only");
    assert.match(workflow, /profile: "draft-only"/);
    assert.equal(
      fs.readFileSync(path.join(temp, "README.md"), "utf8"),
      "keep me\n"
    );
    assert.throws(
      () => initStarter(options, temp),
      /Refusing to overwrite existing file\(s\)/
    );
    assert.equal(
      JSON.parse(fs.readFileSync(created.cardPath, "utf8")).name,
      "Support Drafting Agent"
    );
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("package and bilingual quickstarts expose the initializer contract", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
  );
  const english = fs.readFileSync(
    path.join(projectRoot, "docs", "quickstart.md"),
    "utf8"
  );
  const chinese = fs.readFileSync(
    path.join(projectRoot, "docs", "quickstart.zh-CN.md"),
    "utf8"
  );

  assert.equal(packageJson.bin["agentic-init"], "./bin/agentic-init.js");
  assert.ok(packageJson.files.includes("starters"));
  assert.match(english, /quickstart\.zh-CN\.md/);
  assert.match(chinese, /\[English\]\(quickstart\.md\)/);
  assert.match(english, /first CI run should report/i);
  assert.match(chinese, /第一次 CI 应报告/);
  assert.match(english, /without modifying either file/);
  assert.match(chinese, /两个文件都不会被修改/);
  assert.match(english, /pins the third-party `actions\/checkout`/);
  assert.match(chinese, /第三方 `actions\/checkout` 固定/);
  assert.match(english, /moving\n`@v0` stable channel/);
  assert.match(chinese, /可移动的 `@v0` 稳定通道/);
  assert.match(english, /CI, Pages, and Star Watch workflows/);
  assert.match(chinese, /CI、Pages 和 Star Watch 工作流/);
  assert.match(english, /Dependabot checks[\s\S]*references weekly/);
  assert.match(chinese, /Dependabot 每周检查/);
  for (const profile of PROFILES) {
    assert.match(english, new RegExp(`\\\`${profile}\\\``));
    assert.match(chinese, new RegExp(`\\\`${profile}\\\``));
    assert.match(
      english,
      new RegExp(`starters/${profile}/agent-card\\.json`)
    );
    assert.match(
      chinese,
      new RegExp(`starters/${profile}/agent-readiness\\.yml`)
    );
  }
});

test("force overwrites both generated paths explicitly", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-init-force-"));
  try {
    initStarter(
      { profile: "read-only", name: "First", force: false },
      temp
    );
    initStarter(
      { profile: "state-changing", name: "Second", force: true },
      temp
    );
    const card = JSON.parse(
      fs.readFileSync(path.join(temp, "agent-card.json"), "utf8")
    );
    const workflow = fs.readFileSync(
      path.join(temp, ".github/workflows/agent-readiness.yml"),
      "utf8"
    );

    assert.equal(card.name, "Second");
    assert.equal(card.risk_profile, "state-changing");
    assert.match(workflow, /profile: "state-changing"/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test("agentic-init runs through an npm-style symlink", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-init-bin-"));
  const link = path.join(temp, "agentic-init");
  try {
    fs.symlinkSync(
      path.join(projectRoot, "bin", "agentic-init.js"),
      link
    );
    const output = execFileSync(
      process.execPath,
      [
        link,
        "--profile",
        "read-only",
        "--name",
        "Documentation Agent"
      ],
      { cwd: temp, encoding: "utf8" }
    );

    assert.match(output, /Created agent-card\.json/);
    assert.match(output, /starter intentionally fails/);
    assert.equal(
      JSON.parse(
        fs.readFileSync(path.join(temp, "agent-card.json"), "utf8")
      ).name,
      "Documentation Agent"
    );

    const second = spawnSync(process.execPath, [link], {
      cwd: temp,
      encoding: "utf8"
    });
    assert.equal(second.status, 1);
    assert.match(second.stderr, /Refusing to overwrite/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});
