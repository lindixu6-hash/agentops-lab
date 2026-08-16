import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  RESULT_OUTCOMES,
  parseEvalResults,
  validateEvalResult,
  validateFixtureReferences
} from "../bin/validate-eval-results.js";
import {
  parseFixtureJsonl
} from "../bin/validate-prompt-injection-fixtures.js";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const fixturePath = path.join(
  projectRoot,
  "evals",
  "prompt-injection",
  "fixtures.jsonl"
);
const fixtures = parseFixtureJsonl(fs.readFileSync(fixturePath, "utf8"));

function readExample(name) {
  return JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "examples", "eval-results", name),
      "utf8"
    )
  );
}

test("passing and failing examples satisfy the result contract", () => {
  const passing = readExample("pass.json");
  const failing = readExample("fail.json");

  assert.equal(validateEvalResult(passing), passing);
  assert.equal(validateEvalResult(failing), failing);
  assert.deepEqual(
    validateFixtureReferences([passing, failing], fixtures),
    [passing, failing]
  );
  assert.deepEqual(
    [passing.outcome, failing.outcome].sort(),
    [...RESULT_OUTCOMES].sort()
  );
  assert.equal(passing.forbidden_action_violations.length, 0);
  assert.ok(failing.forbidden_action_violations.length > 0);
});

test("validator rejects missing and unknown fields", () => {
  const valid = readExample("pass.json");
  const { agent_version: ignored, ...missing } = valid;

  assert.throws(
    () => validateEvalResult(missing),
    /missing required field\(s\): agent_version/
  );
  assert.throws(
    () => validateEvalResult({ ...valid, extra: true }),
    /unknown field\(s\): extra/
  );
});

test("validator rejects invalid outcomes and inconsistent passes", () => {
  const valid = readExample("pass.json");

  assert.throws(
    () => validateEvalResult({ ...valid, outcome: "skipped" }),
    /outcome must be one of pass, fail/
  );
  assert.throws(
    () =>
      validateEvalResult({
        ...valid,
        forbidden_action_violations: ["A privileged write occurred"]
      }),
    /passing result cannot contain forbidden-action violations/
  );
});

test("parser rejects duplicate result IDs", () => {
  const valid = readExample("pass.json");

  assert.throws(
    () => parseEvalResults(JSON.stringify([valid, valid])),
    /duplicate result id/
  );
});

test("validator rejects broken fixture references", () => {
  const valid = readExample("pass.json");

  assert.throws(
    () =>
      validateFixtureReferences(
        [{ ...valid, fixture_id: "pi-missing-fixture" }],
        fixtures
      ),
    /unknown fixture_id pi-missing-fixture/
  );
});

test("parser accepts a JSON object, JSON array, and JSONL", () => {
  const passing = readExample("pass.json");
  const failing = readExample("fail.json");

  assert.equal(parseEvalResults(JSON.stringify(passing)).length, 1);
  assert.equal(parseEvalResults(JSON.stringify([passing, failing])).length, 2);
  assert.equal(
    parseEvalResults(
      `${JSON.stringify(passing)}\n${JSON.stringify(failing)}\n`
    ).length,
    2
  );
});

test("JSON Schema matches the deterministic validator contract", () => {
  const schema = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "schema", "eval-result.schema.json"),
      "utf8"
    )
  );

  assert.deepEqual(schema.required.sort(), [
    "agent",
    "agent_version",
    "evidence_references",
    "fixture_id",
    "forbidden_action_violations",
    "id",
    "observed_actions",
    "outcome",
    "policy_trace_references",
    "timestamp",
    "tool_trace_references"
  ]);
  assert.deepEqual(schema.properties.outcome.enum, RESULT_OUTCOMES);
  assert.equal(schema.properties.timestamp.format, "date-time");
  assert.equal(schema.additionalProperties, false);
});

test("bilingual docs explain adapters and structural validation limits", () => {
  const docsRoot = path.join(
    projectRoot,
    "evals",
    "prompt-injection",
    "results"
  );
  const english = fs.readFileSync(path.join(docsRoot, "README.md"), "utf8");
  const chinese = fs.readFileSync(
    path.join(docsRoot, "README.zh-CN.md"),
    "utf8"
  );

  assert.match(english, /framework adapter/);
  assert.match(english, /does not prove.*Agent is safe/s);
  assert.match(chinese, /框架适配器/);
  assert.match(chinese, /不能证明.*Agent 安全/s);
  assert.match(english, /README\.zh-CN\.md/);
  assert.match(chinese, /\[English\]\(README\.md\)/);
});

test("examples contain no live secrets or network endpoints", () => {
  const examples = ["pass.json", "fail.json"]
    .map((name) =>
      fs.readFileSync(
        path.join(projectRoot, "examples", "eval-results", name),
        "utf8"
      )
    )
    .join("\n");

  assert.doesNotMatch(examples, /https?:\/\//);
  assert.doesNotMatch(examples, /\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{16,}\b/);
  assert.doesNotMatch(examples, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
});
