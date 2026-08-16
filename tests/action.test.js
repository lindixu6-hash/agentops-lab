import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildSummary,
  launchBlockersFor,
  parseBoolean,
  readInputs,
  runAction
} from "../action/index.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");

test("readInputs parses GitHub Action inputs", () => {
  const inputs = readInputs({
    "INPUT_CARD": "examples/support-agent.card.json",
    "INPUT_PROFILE": "draft-only",
    "INPUT_MIN-SCORE": "12",
    "INPUT_FAIL-BELOW": "false",
    "INPUT_FAIL-ON-BLOCKERS": "true"
  });

  assert.equal(inputs.card, "examples/support-agent.card.json");
  assert.equal(inputs.profile, "draft-only");
  assert.equal(inputs.minScore, 12);
  assert.equal(inputs.failBelow, false);
  assert.equal(inputs.failOnBlockers, true);
});

test("readInputs defaults to a consumer-owned Agent Card", () => {
  const inputs = readInputs({});

  assert.equal(inputs.card, "agent-card.json");
  assert.equal(inputs.profile, "");
  assert.equal(inputs.minScore, 15);
  assert.equal(inputs.failBelow, true);
  assert.equal(inputs.failOnBlockers, false);
});

test("parseBoolean rejects ambiguous input", () => {
  assert.equal(parseBoolean("yes", "flag"), true);
  assert.equal(parseBoolean("off", "flag"), false);
  assert.throws(() => parseBoolean("maybe", "flag"), /true or false/);
});

test("action writes score outputs and summary", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-action-"));
  const output = path.join(temp, "output.txt");
  const summary = path.join(temp, "summary.md");

  const result = runAction({
    cwd: repoRoot,
    env: {
      INPUT_CARD: "examples/coding-agent.card.json",
      "INPUT_MIN-SCORE": "15",
      "INPUT_FAIL-BELOW": "true",
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary
    },
    log: () => {}
  });

  assert.equal(result.total, 16);
  assert.equal(result.passed, true);
  assert.equal(result.blockerCount, 2);
  assert.equal(result.blockersPassed, true);
  assert.match(fs.readFileSync(output, "utf8"), /score=16/);
  assert.match(fs.readFileSync(output, "utf8"), /rating=limited beta/);
  assert.match(fs.readFileSync(output, "utf8"), /blocker-count=2/);
  assert.match(fs.readFileSync(output, "utf8"), /passed=true/);
  assert.match(fs.readFileSync(summary, "utf8"), /Overall gate: \*\*PASS\*\*/);
  assert.match(fs.readFileSync(summary, "utf8"), /strict mode off/);
});

test("action can fail a readiness gate", () => {
  assert.throws(
    () =>
      runAction({
        cwd: repoRoot,
        env: {
          INPUT_CARD: "examples/support-agent.card.json",
          "INPUT_MIN-SCORE": "20",
          "INPUT_FAIL-BELOW": "true"
        },
        log: () => {}
      }),
    /below required 20/
  );
});

test("action can fail on declared launch blockers independently of score", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-blockers-"));
  const output = path.join(temp, "output.txt");

  assert.throws(
    () =>
      runAction({
        cwd: repoRoot,
        env: {
          INPUT_CARD: "examples/coding-agent.card.json",
          "INPUT_MIN-SCORE": "15",
          "INPUT_FAIL-BELOW": "true",
          "INPUT_FAIL-ON-BLOCKERS": "true",
          GITHUB_OUTPUT: output
        },
        log: () => {}
      }),
    /2 launch blocker\(s\) remain/
  );
  assert.match(fs.readFileSync(output, "utf8"), /passed=false/);
  assert.match(fs.readFileSync(output, "utf8"), /blocker-count=2/);
});

test("strict blocker mode passes when no launch blockers remain", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "agentic-no-blockers-"));
  const source = JSON.parse(
    fs.readFileSync(
      path.join(repoRoot, "examples/coding-agent.card.json"),
      "utf8"
    )
  );
  source.launch_blockers = [];
  fs.writeFileSync(
    path.join(temp, "agent-card.json"),
    JSON.stringify(source),
    "utf8"
  );

  const result = runAction({
    cwd: temp,
    env: {
      INPUT_CARD: "agent-card.json",
      "INPUT_MIN-SCORE": "15",
      "INPUT_FAIL-BELOW": "true",
      "INPUT_FAIL-ON-BLOCKERS": "true"
    },
    log: () => {}
  });

  assert.equal(result.scorePassed, true);
  assert.equal(result.blockersPassed, true);
  assert.equal(result.passed, true);
  assert.equal(result.blockerCount, 0);
});

test("launchBlockersFor rejects malformed blocker metadata", () => {
  assert.deepEqual(launchBlockersFor({}), []);
  assert.deepEqual(launchBlockersFor({ launch_blockers: [" Needs evals "] }), [
    "Needs evals"
  ]);
  assert.throws(
    () => launchBlockersFor({ launch_blockers: [""] }),
    /non-empty strings/
  );
  assert.throws(
    () => launchBlockersFor({ launch_blockers: "Needs evals" }),
    /array/
  );
});

test("buildSummary contains all score areas", () => {
  const rows = [
    { label: "Goal clarity", value: 2 },
    { label: "Security", value: 1 }
  ];
  const summary = buildSummary(
    { name: "Example" },
    { total: 3, max: 4, rating: "prototype", rows },
    {
      passed: false,
      scorePassed: true,
      blockersPassed: false,
      blockers: ["Needs evals"],
      minScore: 3,
      failOnBlockers: true
    },
    "![badge](url)"
  );

  assert.match(summary, /Goal clarity/);
  assert.match(summary, /Security/);
  assert.match(summary, /Overall gate: \*\*FAIL\*\*/);
  assert.match(summary, /Score gate: \*\*PASS\*\*/);
  assert.match(summary, /Launch blocker gate: \*\*FAIL\*\*/);
  assert.match(summary, /Needs evals/);
});
