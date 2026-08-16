import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
const adapterRoot = path.join(projectRoot, "adapters", "langgraph");
const fixturePath = path.join(
  projectRoot,
  "evals",
  "prompt-injection",
  "fixtures.jsonl"
);
const fixtures = parseFixtureJsonl(fs.readFileSync(fixturePath, "utf8"));
const dependencyPath = path.join(
  adapterRoot,
  "node_modules",
  "@langchain",
  "langgraph",
  "package.json"
);

async function loadAdapter(t) {
  if (!fs.existsSync(dependencyPath)) {
    t.skip("run npm ci --prefix adapters/langgraph to execute integration tests");
    return null;
  }
  return import("../adapters/langgraph/run.js");
}

test("LangGraph adapter pins the external runtime in an isolated lockfile", () => {
  const packageJson = JSON.parse(
    fs.readFileSync(path.join(adapterRoot, "package.json"), "utf8")
  );
  const lock = JSON.parse(
    fs.readFileSync(path.join(adapterRoot, "package-lock.json"), "utf8")
  );
  const rootPackage = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package.json"), "utf8")
  );

  assert.equal(packageJson.dependencies["@langchain/langgraph"], "1.4.10");
  assert.equal(
    lock.packages["node_modules/@langchain/langgraph"].version,
    "1.4.10"
  );
  assert.equal(rootPackage.dependencies, undefined);
  assert.equal(rootPackage.files.includes("adapters"), false);
  assert.ok(
    rootPackage.files.includes("adapters/langgraph/package-lock.json")
  );
  assert.ok(rootPackage.files.includes("adapters/langgraph/run.js"));
});

test("real StateGraph executes both nodes for all fixtures", async (t) => {
  const adapter = await loadAdapter(t);
  if (!adapter) return;

  for (const fixture of fixtures) {
    const run = await adapter.runLangGraphAgent(fixture);
    const nodes = new Set(run.policyTrace.map((event) => event.node));

    assert.deepEqual(nodes, new Set([
      "classify_untrusted_content",
      "produce_response"
    ]));
    assert.equal(run.decision, fixture.expected_outcome);
    assert.ok(
      run.policyTrace.every(
        (event) => event.runtime === "@langchain/langgraph"
      )
    );
  }
});

test("LangGraph suite emits valid results and complete evidence", async (t) => {
  const adapter = await loadAdapter(t);
  if (!adapter) return;
  const output = fs.mkdtempSync(path.join(os.tmpdir(), "langgraph-eval-"));

  try {
    const results = await adapter.runLangGraphSuite(
      fixtures,
      output,
      "2026-08-17T00:00:00.000Z"
    );
    const parsed = parseEvalResults(
      fs.readFileSync(path.join(output, "results.jsonl"), "utf8")
    );
    validateFixtureReferences(parsed, fixtures);

    assert.equal(results.length, 8);
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
    assert.equal(summary.runtime, "@langchain/langgraph@1.4.10");
    assert.deepEqual(
      [summary.total, summary.passed, summary.failed],
      [8, 8, 0]
    );
  } finally {
    fs.rmSync(output, { recursive: true, force: true });
  }
});

test("LangGraph evaluator preserves observed failures", async (t) => {
  const adapter = await loadAdapter(t);
  if (!adapter) return;
  const fixture = { ...fixtures[0], expected_outcome: "refuse" };
  const run = await adapter.runLangGraphAgent(fixture);
  const result = adapter.evaluateLangGraphRun(
    fixture,
    run,
    "2026-08-17T00:00:00.000Z"
  );

  assert.equal(run.decision, "ignore_and_continue");
  assert.equal(result.outcome, "fail");
});

test("bilingual LangGraph docs state integration evidence limits", () => {
  const english = fs.readFileSync(
    path.join(adapterRoot, "README.md"),
    "utf8"
  );
  const chinese = fs.readFileSync(
    path.join(adapterRoot, "README.zh-CN.md"),
    "utf8"
  );

  assert.match(english, /real.*StateGraph/i);
  assert.match(english, /does not benchmark an LLM/i);
  assert.match(english, /does not prove arbitrary LangGraph applications/);
  assert.match(chinese, /真实.*StateGraph/);
  assert.match(chinese, /不是 LLM Benchmark/);
  assert.match(chinese, /不能证明任意 LangGraph 应用都安全/);
  assert.match(english, /README\.zh-CN\.md/);
  assert.match(chinese, /\[English\]\(README\.md\)/);
});
