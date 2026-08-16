#!/usr/bin/env node

import fs from "node:fs";
import { fileURLToPath } from "node:url";

export const CATEGORIES = [
  "direct_override",
  "retrieved_web_content",
  "email_document_injection",
  "tool_output_injection",
  "data_exfiltration_request",
  "benign_control"
];

export const OUTCOMES = [
  "ignore_and_continue",
  "refuse",
  "escalate",
  "allow"
];

const REQUIRED_KEYS = [
  "id",
  "category",
  "title",
  "trusted_instruction",
  "untrusted_content",
  "expected_action",
  "forbidden_action",
  "evidence_required",
  "expected_outcome"
];

function assertNonEmptyString(value, field, lineNumber) {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`Line ${lineNumber}: ${field} must be a non-empty string.`);
  }
}

function assertStringArray(value, field, lineNumber) {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(
      `Line ${lineNumber}: ${field} must be a non-empty string array.`
    );
  }
  value.forEach((item, index) => {
    assertNonEmptyString(item, `${field}[${index}]`, lineNumber);
  });
}

export function validateFixture(fixture, lineNumber = 1) {
  if (!fixture || typeof fixture !== "object" || Array.isArray(fixture)) {
    throw new Error(`Line ${lineNumber}: fixture must be a JSON object.`);
  }

  const keys = Object.keys(fixture);
  const missing = REQUIRED_KEYS.filter((key) => !keys.includes(key));
  const extra = keys.filter((key) => !REQUIRED_KEYS.includes(key));
  if (missing.length > 0) {
    throw new Error(
      `Line ${lineNumber}: missing required field(s): ${missing.join(", ")}.`
    );
  }
  if (extra.length > 0) {
    throw new Error(
      `Line ${lineNumber}: unknown field(s): ${extra.join(", ")}.`
    );
  }

  assertNonEmptyString(fixture.id, "id", lineNumber);
  if (!/^pi-[a-z0-9-]+$/.test(fixture.id)) {
    throw new Error(
      `Line ${lineNumber}: id must match ^pi-[a-z0-9-]+$.`
    );
  }
  if (!CATEGORIES.includes(fixture.category)) {
    throw new Error(
      `Line ${lineNumber}: category must be one of ${CATEGORIES.join(", ")}.`
    );
  }
  assertNonEmptyString(fixture.title, "title", lineNumber);
  assertNonEmptyString(
    fixture.trusted_instruction,
    "trusted_instruction",
    lineNumber
  );

  const untrusted = fixture.untrusted_content;
  if (!untrusted || typeof untrusted !== "object" || Array.isArray(untrusted)) {
    throw new Error(
      `Line ${lineNumber}: untrusted_content must be an object.`
    );
  }
  const untrustedKeys = Object.keys(untrusted);
  if (
    untrustedKeys.length !== 2 ||
    !untrustedKeys.includes("source") ||
    !untrustedKeys.includes("content")
  ) {
    throw new Error(
      `Line ${lineNumber}: untrusted_content must contain only source and content.`
    );
  }
  assertNonEmptyString(untrusted.source, "untrusted_content.source", lineNumber);
  assertNonEmptyString(
    untrusted.content,
    "untrusted_content.content",
    lineNumber
  );

  assertStringArray(fixture.expected_action, "expected_action", lineNumber);
  assertStringArray(fixture.forbidden_action, "forbidden_action", lineNumber);
  assertStringArray(
    fixture.evidence_required,
    "evidence_required",
    lineNumber
  );

  if (!OUTCOMES.includes(fixture.expected_outcome)) {
    throw new Error(
      `Line ${lineNumber}: expected_outcome must be one of ${OUTCOMES.join(", ")}.`
    );
  }

  return fixture;
}

export function parseFixtureJsonl(content) {
  const fixtures = [];
  const ids = new Set();

  content.split(/\r?\n/).forEach((line, index) => {
    const lineNumber = index + 1;
    if (!line.trim()) return;

    let fixture;
    try {
      fixture = JSON.parse(line);
    } catch (error) {
      throw new Error(`Line ${lineNumber}: invalid JSON: ${error.message}`);
    }
    validateFixture(fixture, lineNumber);
    if (ids.has(fixture.id)) {
      throw new Error(`Line ${lineNumber}: duplicate id ${fixture.id}.`);
    }
    ids.add(fixture.id);
    fixtures.push(fixture);
  });

  if (fixtures.length === 0) {
    throw new Error("Fixture file must contain at least one JSON object.");
  }
  return fixtures;
}

export function validateFixtureFile(filePath) {
  return parseFixtureJsonl(fs.readFileSync(filePath, "utf8"));
}

function usage() {
  return [
    "Usage: agentic-validate-fixtures <fixtures.jsonl>",
    "",
    "Example:",
    "  agentic-validate-fixtures evals/prompt-injection/fixtures.jsonl"
  ].join("\n");
}

export function main(argv = process.argv) {
  const filePath = argv[2];
  if (!filePath || filePath === "-h" || filePath === "--help") {
    console.log(usage());
    return filePath ? 0 : 1;
  }

  const fixtures = validateFixtureFile(filePath);
  const counts = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      fixtures.filter((fixture) => fixture.category === category).length
    ])
  );

  console.log(`Validated ${fixtures.length} prompt-injection fixture(s).`);
  for (const [category, count] of Object.entries(counts)) {
    console.log(`- ${category}: ${count}`);
  }
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
