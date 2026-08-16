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
const chineseDocument = fs.readFileSync(
  path.join(testDir, "../docs/production-incidents.zh-CN.md"),
  "utf8"
);

test("incident library contains six source-linked cases", () => {
  const cases = document.match(/^## \d+\. /gm) || [];
  const sourceSections = document.match(/^### Sources$/gm) || [];

  assert.equal(cases.length, 6);
  assert.equal(sourceSections.length, 6);
});

test("incident library distinguishes impact from demonstrations", () => {
  assert.match(document, /Confirmed incident/);
  assert.match(document, /Adversarial public test; no completed \$1 sale/);
  assert.match(document, /no reported\s+in-the-wild exploitation/);
  assert.match(document, /Research proof of concept/);
});

test("every incident provides signals, controls, sources, and regression tests", () => {
  const sections = document.split(/^## \d+\. /m).slice(1);

  assert.equal(sections.length, 6);
  for (const section of sections) {
    assert.match(section, /### Detection signal/);
    assert.match(section, /### Controls/);
    assert.match(section, /### Regression tests/);
    assert.match(section, /### Sources/);
    assert.match(section, /Given:/);
    assert.match(section, /When:/);
    assert.match(section, /Then:/);
  }
});

test("Chinese incident library mirrors six cases and status boundaries", () => {
  const cases = chineseDocument.match(/^## \d+\. /gm) || [];
  const sourceSections = chineseDocument.match(/^### 来源$/gm) || [];
  const sections = chineseDocument.split(/^## \d+\. /m).slice(1);

  assert.equal(cases.length, 6);
  assert.equal(sourceSections.length, 6);
  assert.equal(sections.length, 6);
  for (const section of sections) {
    assert.match(section, /### 检测信号/);
    assert.match(section, /### 控制措施/);
    assert.match(section, /### 回归测试/);
    assert.match(section, /### 来源/);
    assert.match(section, /Given：/);
    assert.match(section, /When：/);
    assert.match(section, /Then：/);
  }
  assert.match(chineseDocument, /已确认事故/);
  assert.match(chineseDocument, /没有完成 1 美元交易/);
  assert.match(chineseDocument, /没有公开的在野利用证据/);
  assert.match(chineseDocument, /研究 PoC/);
});

test("Gemini CLI case preserves disclosure, patch, and impact boundaries", () => {
  const englishCase = document.split(
    "## 6. Gemini CLI trusted untrusted CI workspace configuration"
  )[1];
  const chineseCase = chineseDocument.split(
    "## 6. Gemini CLI 在 CI 中信任了不可信工作区配置"
  )[1];

  assert.ok(englishCase);
  assert.ok(chineseCase);
  assert.match(englishCase, /CVE-2026-12537/);
  assert.match(englishCase, /GHSA-wpqr-6v78-jr5g/);
  assert.match(englishCase, /0\.39\.1/);
  assert.match(englishCase, /0\.1\.22/);
  assert.match(englishCase, /do not establish that\s+the issue was exploited in the wild/);
  assert.match(
    englishCase,
    /google-github-actions\/run-gemini-cli\/security\/advisories\/GHSA-wpqr-6v78-jr5g/
  );
  assert.match(englishCase, /docs\/trust-guidance\.md/);
  assert.match(englishCase, /cve\.org\/CVERecord\?id=CVE-2026-12537/);
  assert.match(chineseCase, /本文不声称存在在野利用/);
  assert.match(chineseCase, /不能\s*证明它曾在真实攻击中被利用/);
});

test("English and Chinese incident libraries link to each other", () => {
  assert.match(document, /production-incidents\.zh-CN\.md/);
  assert.match(chineseDocument, /production-incidents\.md/);
});
