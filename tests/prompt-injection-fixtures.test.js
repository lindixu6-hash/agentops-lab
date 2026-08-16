import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  CATEGORIES,
  OUTCOMES,
  parseFixtureJsonl,
  validateFixture
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

test("fixture pack covers every required injection category", () => {
  assert.equal(fixtures.length, 8);
  assert.deepEqual(
    [...new Set(fixtures.map((fixture) => fixture.category))].sort(),
    [...CATEGORIES].sort()
  );

  const benign = fixtures.filter(
    (fixture) => fixture.category === "benign_control"
  );
  assert.equal(benign.length, 2);
});

test("every fixture has actionable expectations and evidence", () => {
  const ids = new Set();

  for (const fixture of fixtures) {
    validateFixture(fixture);
    assert.equal(ids.has(fixture.id), false, `duplicate id: ${fixture.id}`);
    ids.add(fixture.id);
    assert.ok(fixture.expected_action.length >= 2);
    assert.ok(fixture.forbidden_action.length >= 2);
    assert.ok(fixture.evidence_required.length >= 2);
  }
});

test("fixture pack contains no live endpoint or secret value", () => {
  const content = fs.readFileSync(fixturePath, "utf8");
  const urls = content.match(/https?:\/\/[^"\s]+/g) || [];

  assert.ok(urls.length > 0, "expected a synthetic endpoint fixture");
  for (const url of urls) {
    assert.match(url, /\.example(?:\/|$)/);
  }
  assert.doesNotMatch(content, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/);
  assert.doesNotMatch(content, /\b(?:sk|ghp|github_pat)_[A-Za-z0-9_-]{16,}\b/);
});

test("validator rejects malformed fields, unknown fields, and duplicate IDs", () => {
  const valid = fixtures[0];

  assert.throws(
    () => validateFixture({ ...valid, expected_action: [] }),
    /expected_action must be a non-empty string array/
  );
  assert.throws(
    () => validateFixture({ ...valid, extra: true }),
    /unknown field/
  );
  assert.throws(
    () =>
      parseFixtureJsonl(
        `${JSON.stringify(valid)}\n${JSON.stringify(valid)}\n`
      ),
    /duplicate id/
  );
  assert.throws(() => parseFixtureJsonl("{not-json}\n"), /invalid JSON/);
});

test("JSON Schema and deterministic validator expose the same contract", () => {
  const schema = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "schema/prompt-injection-fixture.schema.json"),
      "utf8"
    )
  );

  assert.deepEqual(schema.required.sort(), [
    "category",
    "evidence_required",
    "expected_action",
    "expected_outcome",
    "forbidden_action",
    "id",
    "title",
    "trusted_instruction",
    "untrusted_content"
  ]);
  assert.deepEqual(schema.properties.category.enum, CATEGORIES);
  assert.deepEqual(schema.properties.expected_outcome.enum, OUTCOMES);
  assert.equal(schema.additionalProperties, false);
});

test("coding and research Agent Cards reference the pack without claiming integration", () => {
  for (const cardName of ["coding-agent.card.json", "research-agent.card.json"]) {
    const card = JSON.parse(
      fs.readFileSync(path.join(projectRoot, "examples", cardName), "utf8")
    );

    assert.deepEqual(card.eval_fixtures, [
      "evals/prompt-injection/fixtures.jsonl"
    ]);
    assert.ok(
      card.launch_blockers.some((blocker) =>
        blocker.includes("wired into")
      )
    );
  }
});

test("Agent Card schema supports fixture references and non-empty blockers", () => {
  const schema = JSON.parse(
    fs.readFileSync(
      path.join(projectRoot, "schema/agent-card.schema.json"),
      "utf8"
    )
  );

  assert.equal(schema.properties.eval_fixtures.type, "array");
  assert.equal(schema.properties.eval_fixtures.items.minLength, 1);
  assert.equal(schema.properties.launch_blockers.items.minLength, 1);
});

test("English and Chinese fixture docs are linked and explain trace evidence", () => {
  const english = fs.readFileSync(
    path.join(projectRoot, "evals/prompt-injection/README.md"),
    "utf8"
  );
  const chinese = fs.readFileSync(
    path.join(projectRoot, "evals/prompt-injection/README.zh-CN.md"),
    "utf8"
  );

  assert.match(english, /README\.zh-CN\.md/);
  assert.match(chinese, /\[English\]\(README\.md\)/);
  assert.match(english, /Tool and policy traces/);
  assert.match(chinese, /工具与策略 Trace/);
  assert.match(english, /reserved `\.example` domains/);
  assert.match(chinese, /保留的 `\.example` 域名/);
});
