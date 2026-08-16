#!/usr/bin/env node

import fs from "node:fs";
import { fileURLToPath } from "node:url";

import {
  parseFixtureJsonl
} from "./validate-prompt-injection-fixtures.js";

export const RESULT_OUTCOMES = ["pass", "fail"];

const REQUIRED_KEYS = [
  "id",
  "fixture_id",
  "agent",
  "agent_version",
  "outcome",
  "observed_actions",
  "forbidden_action_violations",
  "evidence_references",
  "tool_trace_references",
  "policy_trace_references",
  "timestamp"
];

function assertNonEmptyString(value, field, position) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`${position}: ${field} must be a non-empty string.`);
  }
}

function assertStringArray(value, field, position, allowEmpty = false) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0)) {
    const qualifier = allowEmpty ? "a string array" : "a non-empty string array";
    throw new Error(`${position}: ${field} must be ${qualifier}.`);
  }
  value.forEach((item, index) => {
    assertNonEmptyString(item, `${field}[${index}]`, position);
  });
}

function isDateTime(value) {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value) &&
    !Number.isNaN(Date.parse(value))
  );
}

export function validateEvalResult(result, position = "Result 1") {
  if (!result || typeof result !== "object" || Array.isArray(result)) {
    throw new Error(`${position}: eval result must be a JSON object.`);
  }

  const keys = Object.keys(result);
  const missing = REQUIRED_KEYS.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !REQUIRED_KEYS.includes(key));
  if (missing.length > 0) {
    throw new Error(
      `${position}: missing required field(s): ${missing.join(", ")}.`
    );
  }
  if (extra.length > 0) {
    throw new Error(
      `${position}: unknown field(s): ${extra.join(", ")}.`
    );
  }

  assertNonEmptyString(result.id, "id", position);
  if (!/^er-[a-z0-9-]+$/.test(result.id)) {
    throw new Error(`${position}: id must match ^er-[a-z0-9-]+$.`);
  }
  assertNonEmptyString(result.fixture_id, "fixture_id", position);
  if (!/^pi-[a-z0-9-]+$/.test(result.fixture_id)) {
    throw new Error(
      `${position}: fixture_id must match ^pi-[a-z0-9-]+$.`
    );
  }
  assertNonEmptyString(result.agent, "agent", position);
  assertNonEmptyString(result.agent_version, "agent_version", position);
  if (!RESULT_OUTCOMES.includes(result.outcome)) {
    throw new Error(
      `${position}: outcome must be one of ${RESULT_OUTCOMES.join(", ")}.`
    );
  }

  assertStringArray(result.observed_actions, "observed_actions", position);
  assertStringArray(
    result.forbidden_action_violations,
    "forbidden_action_violations",
    position,
    true
  );
  assertStringArray(
    result.evidence_references,
    "evidence_references",
    position
  );
  assertStringArray(
    result.tool_trace_references,
    "tool_trace_references",
    position
  );
  assertStringArray(
    result.policy_trace_references,
    "policy_trace_references",
    position
  );

  if (!isDateTime(result.timestamp)) {
    throw new Error(`${position}: timestamp must be an RFC 3339 date-time.`);
  }
  if (
    result.outcome === "pass" &&
    result.forbidden_action_violations.length > 0
  ) {
    throw new Error(
      `${position}: a passing result cannot contain forbidden-action violations.`
    );
  }

  return result;
}

function parseJsonLines(content) {
  const results = [];
  content.split(/\r?\n/).forEach((line, index) => {
    if (!line.trim()) return;
    try {
      results.push(JSON.parse(line));
    } catch (error) {
      throw new Error(`Line ${index + 1}: invalid JSON: ${error.message}`);
    }
  });
  return results;
}

export function parseEvalResults(content) {
  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = parseJsonLines(content);
  }

  const results = Array.isArray(parsed) ? parsed : [parsed];
  if (results.length === 0) {
    throw new Error("Eval result file must contain at least one result.");
  }

  const ids = new Set();
  results.forEach((result, index) => {
    const position = `Result ${index + 1}`;
    validateEvalResult(result, position);
    if (ids.has(result.id)) {
      throw new Error(`${position}: duplicate result id ${result.id}.`);
    }
    ids.add(result.id);
  });
  return results;
}

export function validateFixtureReferences(results, fixtures) {
  const fixtureIds = new Set(fixtures.map((fixture) => fixture.id));
  results.forEach((result, index) => {
    if (!fixtureIds.has(result.fixture_id)) {
      throw new Error(
        `Result ${index + 1}: unknown fixture_id ${result.fixture_id}.`
      );
    }
  });
  return results;
}

export function validateEvalResultFile(resultPath, fixturePath) {
  const results = parseEvalResults(fs.readFileSync(resultPath, "utf8"));
  const fixtures = parseFixtureJsonl(fs.readFileSync(fixturePath, "utf8"));
  return validateFixtureReferences(results, fixtures);
}

function usage() {
  return [
    "Usage: agentic-validate-results <results.json|results.jsonl> --fixtures <fixtures.jsonl>",
    "",
    "Example:",
    "  agentic-validate-results examples/eval-results/pass.json \\",
    "    --fixtures evals/prompt-injection/fixtures.jsonl"
  ].join("\n");
}

function parseArguments(argv) {
  const args = argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    return { help: true };
  }
  const fixtureFlag = args.indexOf("--fixtures");
  if (
    args.length !== 3 ||
    fixtureFlag === -1 ||
    !args[fixtureFlag + 1]
  ) {
    return {};
  }
  const resultPath = args.find((value, index) => {
    return index !== fixtureFlag && index !== fixtureFlag + 1;
  });
  return { resultPath, fixturePath: args[fixtureFlag + 1] };
}

export function main(argv = process.argv) {
  const options = parseArguments(argv);
  if (options.help || !options.resultPath || !options.fixturePath) {
    console.log(usage());
    return options.help ? 0 : 1;
  }

  const results = validateEvalResultFile(
    options.resultPath,
    options.fixturePath
  );
  const passed = results.filter((result) => result.outcome === "pass").length;
  const failed = results.length - passed;
  console.log(`Validated ${results.length} eval result(s).`);
  console.log(`- pass: ${passed}`);
  console.log(`- fail: ${failed}`);
  console.log("Structural validation does not prove model or agent safety.");
  return 0;
}

const isCli =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  try {
    process.exitCode = main(process.argv);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
