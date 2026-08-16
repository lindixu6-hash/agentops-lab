import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function read(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function structuredData(html) {
  const match = html.match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/
  );
  assert.ok(match, "expected JSON-LD structured data");
  return JSON.parse(match[1]);
}

test("English and Chinese guides expose reciprocal search metadata", () => {
  const english = read("web/guide/index.html");
  const chinese = read("web/zh/guide/index.html");

  assert.match(
    english,
    /rel="canonical"\s+href="https:\/\/lindixu6-hash\.github\.io\/awesome-agentic-engineering\/guide\/"/
  );
  assert.match(
    chinese,
    /rel="canonical"\s+href="https:\/\/lindixu6-hash\.github\.io\/awesome-agentic-engineering\/zh\/guide\/"/
  );
  assert.match(english, /hreflang="zh-CN"/);
  assert.match(chinese, /hreflang="en"/);
  assert.match(english, /AI Agent Production Readiness Checklist/);
  assert.match(chinese, /AI Agent 生产就绪检查清单/);
});

test("guide structured data identifies both localized TechArticles", () => {
  const english = structuredData(read("web/guide/index.html"));
  const chinese = structuredData(read("web/zh/guide/index.html"));

  assert.equal(english["@type"], "TechArticle");
  assert.equal(english.inLanguage, "en");
  assert.equal(chinese["@type"], "TechArticle");
  assert.equal(chinese.inLanguage, "zh-CN");
  assert.equal(english.dateModified, "2026-08-17");
  assert.equal(chinese.dateModified, "2026-08-17");
});

test("sitemap and robots expose every public Pages entry", () => {
  const sitemap = read("web/sitemap.xml");
  const robots = read("web/robots.txt");

  assert.match(sitemap, /awesome-agentic-engineering\/<\/loc>/);
  assert.match(sitemap, /awesome-agentic-engineering\/guide\/<\/loc>/);
  assert.match(sitemap, /awesome-agentic-engineering\/zh\/guide\/<\/loc>/);
  assert.match(sitemap, /hreflang="zh-CN"/);
  assert.match(
    robots,
    /Sitemap: https:\/\/lindixu6-hash\.github\.io\/awesome-agentic-engineering\/sitemap\.xml/
  );
});

test("Pages build copies the complete web tree", () => {
  const workflow = read(".github/workflows/pages.yml");

  assert.match(workflow, /cp -R web\/\. _site\//);
});
