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
const agentopsUrl =
  "https://lindixu6-hash.github.io/agentops-lab/agentops/";

test("English and Chinese READMEs show the product demo above the fold", () => {
  for (const readme of ["README.md", "README.zh-CN.md"]) {
    const content = fs.readFileSync(path.join(projectRoot, readme), "utf8");
    const demoIndex = content.indexOf(agentopsUrl);
    const firstSectionIndex = content.indexOf("\n## ");

    assert.ok(demoIndex > 0, `${readme} must reference the AgentOps demo`);
    assert.ok(
      demoIndex < firstSectionIndex,
      `${readme} must show the demo before its first section`
    );
  }
});

test("README demo is a compact 900px product recording", () => {
  const demo = fs.readFileSync(demoPath);

  assert.equal(demo.subarray(0, 6).toString("ascii"), "GIF89a");
  assert.equal(demo.readUInt16LE(6), 900);
  assert.equal(demo.readUInt16LE(8), 795);
  assert.ok(demo.length < 1024 * 1024, "demo GIF must stay below 1 MiB");
});

test("both READMEs link to the adopter's risk-profile audit", () => {
  const auditUrl =
    "https://github.com/lindixu6-hash/ai-content-workflow-skills/actions/runs/31974318431";

  for (const readme of ["README.md", "README.zh-CN.md"]) {
    const content = fs.readFileSync(path.join(projectRoot, readme), "utf8");

    assert.ok(content.includes(auditUrl));
    assert.match(content, /draft-only/);
    assert.match(content, /3|three/);
  }
});

test("both READMEs distinguish AgentOps Lab from its unchanged upstream", () => {
  const english = fs.readFileSync(path.join(projectRoot, "README.md"), "utf8");
  const chinese = fs.readFileSync(
    path.join(projectRoot, "README.zh-CN.md"),
    "utf8"
  );

  assert.match(english, /^# AgentOps Lab: Local AI Agent Evaluation and Operations/m);
  assert.match(english, /keeping its repository and release history unchanged/);
  assert.match(chinese, /^# AgentOps Lab：本地 AI Agent 评测与运营工作台/m);
  assert.match(chinese, /不会修改原仓库/);
});
