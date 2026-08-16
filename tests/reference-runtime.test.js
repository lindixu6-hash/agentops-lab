import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  evaluateRun,
  runReferenceAgent,
  runSuite
} from "../adapters/reference-runtime/run.js";
import {
  parseEvalResults,
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
const timestamp = "2026-08-17T00:00:00.000Z";

test("reference runtime executes every malicious and benign fixture", () => {
  const runs = fixtures.map((fixture) => ({
    fixture,
    run: runReferenceAgent(fixture)
  }));

  assert.equal(runs.length, 8);
  assert.ok(
    runs.some(({ fixture }) => fixture.category === "benign_control")
  );
  assert.ok(
    runs.some(({ fixture }) => fixture.category !== "benign_control")
  );
  assert.deepEqual(
    runs.map(({ run }) => run.decision),
    fixtures.map((fixture) => fixture.expected_outcome)
  );
});

test("runner keeps trusted and untrusted channels separate", () => {
  for (const fixture of fixtures) {
    const run = runReferenceAgent(fixture);

    assert.equal(run.policyTrace[0].channel, "trusted");
    assert.equal(run.policyTrace[1].channel, "untrusted");
    assert.equal(
      run.policyTrace[1].source,
      fixture.untrusted_content.source
    );
  }
});

test("suite generates results and referenced evidence artifacts", () => {
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "reference-eval-"));
  try {
    const results = runSuite(fixtures, output, timestamp);
    const parsed = parseEvalResults(
      fs.readFileSync(path.join(output, "results.jsonl"), "utf8")
    );
    validateFixtureReferences(parsed, fixtures);

    assert.equal(results.length, fixtures.length);
    assert.equal(parsed.length, fixtures.length);
    assert.ok(parsed.every((result) => result.outcome === "pass"));
    for (const result of parsed) {
      for (const reference of [
        ...result.evidence_references,
        ...result.tool_trace_references,
        ...result.policy_trace_references
      ]) {
        assert.equal(fs.existsSync(path.join(output, reference)), true);
      }
    }

    const summary = JSON.parse(
      fs.readFileSync(path.join(output, "summary.json"), "utf8")
    );
    assert.deepEqual(
      {
        total: summary.total,
        passed: summary.passed,
        failed: summary.failed
      },
      { total: 8, passed: 8, failed: 0 }
    );
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test("external evaluator emits a failure for observed outcome mismatch", () => {
  const fixture = {
    ...fixtures[0],
    expected_outcome: "refuse"
  };
  const run = runReferenceAgent(fixture);
  const result = evaluateRun(fixture, run, timestamp);

  assert.equal(run.decision, "ignore_and_continue");
  assert.equal(result.outcome, "fail");
  assert.match(result.observed_actions[1], /ignore_and_continue/);
  assert.match(result.observed_actions[2], /refuse/);
});

test("secret and cross-tenant paths make no privileged tool call", () => {
  const protectedFixtures = fixtures.filter((fixture) =>
    [
      "pi-synthetic-secret-exfiltration",
      "pi-cross-tenant-export"
    ].includes(fixture.id)
  );

  for (const fixture of protectedFixtures) {
    const run = runReferenceAgent(fixture);

    assert.equal(run.toolTrace.length, 0);
    assert.equal(run.forbiddenActionViolations.length, 0);
  }
});

test("bilingual adapter docs preserve scope and Content OS boundary", () => {
  const docsRoot = path.join(projectRoot, "adapters/reference-runtime");
  const english = fs.readFileSync(path.join(docsRoot, "README.md"), "utf8");
  const chinese = fs.readFileSync(
    path.join(docsRoot, "README.zh-CN.md"),
    "utf8"
  );

  assert.match(english, /not a model benchmark/i);
  assert.match(english, /Content OS cannot claim these passes/);
  assert.match(english, /evaluator must remain outside/i);
  assert.match(chinese, /不是模型 Benchmark/);
  assert.match(chinese, /不能把这些结果声称为自己的通过/);
  assert.match(chinese, /Evaluator 必须位于/);
  assert.match(english, /README\.zh-CN\.md/);
  assert.match(chinese, /\[English\]\(README\.md\)/);
});
