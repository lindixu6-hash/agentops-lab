import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  analyzeRecords,
  buildMarkdownReport,
  evaluateInput,
  normalizeRecords,
  parseCsv,
  parseInput
} from "../lib/agentops-report.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const samplePath = path.join(testDir, "../examples/agentops-sample.csv");
const pagePath = path.join(testDir, "../web/agentops/index.html");

test("CSV parser handles quotes, commas, and escaped quotes", () => {
  const records = parseCsv(
    'task_id,success,error_type\n1,false,"tool, timeout"\n2,true,"say ""ok"""\n'
  );

  assert.equal(records.length, 2);
  assert.equal(records[0].error_type, "tool, timeout");
  assert.equal(records[1].error_type, 'say "ok"');
});

test("input parser supports arrays and wrapped JSON records", () => {
  assert.equal(parseInput('[{"success":true}]', "runs.json").length, 1);
  assert.equal(
    parseInput('{"records":[{"status":"failed"}]}', "runs.json").length,
    1
  );
  assert.throws(() => parseInput('{"items":[]}', "runs.json"), /records array/);
});

test("normalizer recognizes aliases and skips rows without a result", () => {
  const normalized = normalizeRecords([
    {
      id: "a",
      status: "success",
      duration_ms: "1200",
      version: "v1"
    },
    {
      trace_id: "b",
      passed: "false",
      error_category: "tool_error",
      human_handoff: "yes"
    },
    { id: "invalid" }
  ]);

  assert.equal(normalized.records.length, 2);
  assert.equal(normalized.invalidRows, 1);
  assert.equal(normalized.records[0].success, true);
  assert.equal(normalized.records[1].human_review, true);
  assert.equal(normalized.records[1].error_type, "tool_error");
});

test("sample evaluation produces version, failure, and operating metrics", () => {
  const result = evaluateInput(fs.readFileSync(samplePath, "utf8"), samplePath);

  assert.equal(result.metrics.total, 30);
  assert.equal(result.metrics.success_count, 22);
  assert.equal(result.metrics.failure_count, 8);
  assert.equal(result.metrics.success_rate, 73.3);
  assert.equal(result.metrics.versions.length, 2);
  assert.equal(result.metrics.error_types[0].name, "tool_error");
  assert.ok(result.metrics.recommendations.some((item) => item.priority === "P0"));
});

test("analysis tolerates missing optional numeric fields", () => {
  const metrics = analyzeRecords([
    {
      task_id: "one",
      success: true,
      latency_ms: null,
      cost_usd: null,
      human_review: false,
      error_type: "",
      prompt_version: "v1",
      user_rating: null
    }
  ]);

  assert.equal(metrics.average_latency_ms, null);
  assert.equal(metrics.average_cost_usd, null);
  assert.equal(metrics.total_cost_usd, 0);
});

test("Markdown report includes evidence, boundaries, and source", () => {
  const result = evaluateInput(fs.readFileSync(samplePath, "utf8"), samplePath);
  const report = buildMarkdownReport(result.metrics, {
    source: "agentops-sample.csv",
    generatedAt: "2026-08-17T00:00:00.000Z"
  });

  assert.match(report, /AgentOps Evaluation Report/);
  assert.match(report, /agentops-sample\.csv/);
  assert.match(report, /Version Comparison/);
  assert.match(report, /Interpretation Boundary/);
});

test("browser MVP exposes local import and report controls", () => {
  const html = fs.readFileSync(pagePath, "utf8");

  assert.match(html, /id="file-input"/);
  assert.match(html, /加载示例/);
  assert.match(html, /下载 Markdown/);
  assert.match(html, /原始文件不会上传/);
});

