import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const demoPath = path.join(
  projectRoot,
  "assets",
  "readiness-scorecard-demo.gif"
);
const scorecardUrl =
  "https://lindixu6-hash.github.io/awesome-agentic-engineering/";

test("English and Chinese READMEs show the product demo above the fold", () => {
  for (const readme of ["README.md", "README.zh-CN.md"]) {
    const content = fs.readFileSync(path.join(projectRoot, readme), "utf8");
    const demoIndex = content.indexOf("assets/readiness-scorecard-demo.gif");
    const firstSectionIndex = content.indexOf("\n## ");

    assert.ok(demoIndex > 0, `${readme} must reference the demo GIF`);
    assert.ok(
      demoIndex < firstSectionIndex,
      `${readme} must show the demo before its first section`
    );
    assert.ok(content.includes(`](${scorecardUrl})`));
  }
});

test("README demo is a compact 900px product recording", () => {
  const demo = fs.readFileSync(demoPath);

  assert.equal(demo.subarray(0, 6).toString("ascii"), "GIF89a");
  assert.equal(demo.readUInt16LE(6), 900);
  assert.equal(demo.readUInt16LE(8), 795);
  assert.ok(demo.length < 1024 * 1024, "demo GIF must stay below 1 MiB");
});

test("both READMEs link to the adopter's strict blocker audit", () => {
  const auditUrl =
    "https://github.com/lindixu6-hash/ai-content-workflow-skills/actions/runs/31970162918";

  for (const readme of ["README.md", "README.zh-CN.md"]) {
    const content = fs.readFileSync(path.join(projectRoot, readme), "utf8");

    assert.ok(content.includes(auditUrl));
    assert.match(content, /3|three/);
  }
});
