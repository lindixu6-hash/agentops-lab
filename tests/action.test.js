import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildSummary,
  parseBoolean,
  readInputs,
  runAction
} from "../action/index.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(testDir, "..");

test("readInputs parses GitHub Action inputs", () => {
  const inputs = readInputs({
    "INPUT_CARD": "examples/support-agent.card.json",
    "INPUT_MIN-SCORE": "12",
    "INPUT_FAIL-BELOW": "false"
  });

  assert.equal(inputs.card, "examples/support-agent.card.json");
  assert.equal(inputs.minScore, 12);
  assert.equal(inputs.failBelow, false);
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
  assert.match(fs.readFileSync(output, "utf8"), /score=16/);
  assert.match(fs.readFileSync(output, "utf8"), /rating=limited beta/);
  assert.match(fs.readFileSync(summary, "utf8"), /Gate: \*\*PASS\*\*/);
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

test("buildSummary contains all score areas", () => {
  const rows = [
    { label: "Goal clarity", value: 2 },
    { label: "Security", value: 1 }
  ];
  const summary = buildSummary(
    { name: "Example" },
    { total: 3, max: 4, rating: "prototype", rows },
    3,
    "![badge](url)"
  );

  assert.match(summary, /Goal clarity/);
  assert.match(summary, /Security/);
  assert.match(summary, /Gate: \*\*PASS\*\*/);
});
