import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const roadmap = fs.readFileSync(path.join(projectRoot, "ROADMAP.md"), "utf8");
const readme = fs.readFileSync(path.join(projectRoot, "README.md"), "utf8");
const chineseReadme = fs.readFileSync(
  path.join(projectRoot, "README.zh-CN.md"),
  "utf8"
);

test("roadmap marks shipped versions through v0.6 as completed", () => {
  for (const version of ["v0.1", "v0.2", "v0.3", "v0.4", "v0.5", "v0.6"]) {
    assert.match(roadmap, new RegExp(`### ${version.replace(".", "\\.")}`));
  }
  assert.doesNotMatch(roadmap, /- \[ \]/);
});

test("roadmap and bilingual READMEs point to current contribution issues", () => {
  for (const document of [roadmap, readme, chineseReadme]) {
    assert.match(document, /issues\/11/);
    assert.match(document, /issues\/12/);
  }
});

test("completed product surfaces are not listed as future README work", () => {
  const futureEnglish = readme.split("## Roadmap")[1] || "";
  const futureChinese = chineseReadme.split("## 后续路线")[1] || "";

  assert.doesNotMatch(futureEnglish, /Add a web scorecard playground/);
  assert.doesNotMatch(futureEnglish, /Add production-readiness badges/);
  assert.doesNotMatch(futureChinese, /增加网页评分器/);
  assert.doesNotMatch(futureChinese, /增加生产就绪 badge/);
});
