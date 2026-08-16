import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const document = fs.readFileSync(
  path.join(testDir, "../docs/production-incidents.md"),
  "utf8"
);

test("incident library contains five source-linked cases", () => {
  const cases = document.match(/^## \d+\. /gm) || [];
  const sourceSections = document.match(/^### Sources$/gm) || [];

  assert.equal(cases.length, 5);
  assert.equal(sourceSections.length, 5);
});

test("incident library distinguishes impact from demonstrations", () => {
  assert.match(document, /Confirmed incident/);
  assert.match(document, /Adversarial public test; no completed \$1 sale/);
  assert.match(document, /no reported\s+in-the-wild exploitation/);
  assert.match(document, /Research proof of concept/);
});

test("every incident provides regression tests", () => {
  const sections = document.split(/^## \d+\. /m).slice(1);

  assert.equal(sections.length, 5);
  for (const section of sections) {
    assert.match(section, /### Regression tests/);
    assert.match(section, /Given:/);
    assert.match(section, /When:/);
    assert.match(section, /Then:/);
  }
});
