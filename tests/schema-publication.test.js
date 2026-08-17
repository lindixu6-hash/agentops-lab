import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const schemaDirectory = path.join(projectRoot, "schema");
const schemaFiles = [
  "agent-card.schema.json",
  "eval-result.schema.json",
  "prompt-injection-fixture.schema.json",
  "readiness-profiles.schema.json"
];
const publicRoot =
  "https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/";

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

test("every schema declares its canonical GitHub Pages identity", () => {
  for (const fileName of schemaFiles) {
    const schema = JSON.parse(
      fs.readFileSync(path.join(schemaDirectory, fileName), "utf8")
    );

    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.$id, `${publicRoot}${fileName}`);
  }
});

test("Agent Card schema accepts a standard schema URI declaration", () => {
  const schema = JSON.parse(read("schema/agent-card.schema.json"));

  assert.equal(schema.properties.$schema.type, "string");
  assert.equal(schema.properties.$schema.format, "uri");
});

test("Pages publishes schemas and redeploys when they change", () => {
  const workflow = read(".github/workflows/pages.yml");

  assert.match(workflow, /- "schema\/\*\*"/);
  assert.match(workflow, /mkdir -p _site\/assets _site\/schema/);
  assert.match(workflow, /cp schema\/\*\.json _site\/schema\//);
});

test("bilingual schema docs distinguish canonical and immutable URLs", () => {
  const english = read("schema/README.md");
  const chinese = read("schema/README.zh-CN.md");

  for (const fileName of schemaFiles) {
    const escaped = fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    assert.match(english, new RegExp(`schema/${escaped}`));
    assert.match(chinese, new RegExp(`schema/${escaped}`));
  }
  assert.match(english, /v0\.15\.0\/schema\/agent-card\.schema\.json/);
  assert.match(chinese, /v0\.15\.0\/schema\/agent-card\.schema\.json/);
  assert.match(english, /validates structure, not evidence authenticity/);
  assert.match(chinese, /只能验证结构，不能证明证据真实/);
  assert.match(english, /README\.zh-CN\.md/);
  assert.match(chinese, /\[English\]\(README\.md\)/);
});
