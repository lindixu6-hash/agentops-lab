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

test("LangGraph eval pages expose reciprocal metadata and verified evidence", () => {
  const english = read("web/langgraph-eval/index.html");
  const chinese = read("web/zh/langgraph-eval/index.html");

  assert.match(
    english,
    /rel="canonical"\s+href="https:\/\/lindixu6-hash\.github\.io\/awesome-agentic-engineering\/langgraph-eval\/"/
  );
  assert.match(
    chinese,
    /rel="canonical"\s+href="https:\/\/lindixu6-hash\.github\.io\/awesome-agentic-engineering\/zh\/langgraph-eval\/"/
  );
  assert.match(english, /hreflang="zh-CN"/);
  assert.match(chinese, /hreflang="en"/);
  assert.match(english, /LangGraph Prompt Injection Eval/);
  assert.match(chinese, /LangGraph 提示注入 Eval/);
  assert.match(english, /31975175069/);
  assert.match(chinese, /31975175069/);
  assert.match(english, /8\/8/);
  assert.match(chinese, /8\/8/);
  assert.match(english, /does not prove arbitrary LangGraph applications/);
  assert.match(chinese, /不能证明任意 LangGraph 应用都安全/);
});

test("LangGraph eval structured data identifies both localized TechArticles", () => {
  const english = structuredData(read("web/langgraph-eval/index.html"));
  const chinese = structuredData(read("web/zh/langgraph-eval/index.html"));

  assert.equal(english["@type"], "TechArticle");
  assert.equal(english.inLanguage, "en");
  assert.equal(chinese["@type"], "TechArticle");
  assert.equal(chinese.inLanguage, "zh-CN");
  assert.match(english.headline, /LangGraph Prompt Injection Eval/);
  assert.match(chinese.headline, /LangGraph 提示注入 Eval/);
});

test("sitemap and robots expose every public Pages entry", () => {
  const sitemap = read("web/sitemap.xml");
  const robots = read("web/robots.txt");

  assert.match(sitemap, /awesome-agentic-engineering\/<\/loc>/);
  assert.match(sitemap, /awesome-agentic-engineering\/guide\/<\/loc>/);
  assert.match(sitemap, /awesome-agentic-engineering\/zh\/guide\/<\/loc>/);
  assert.match(
    sitemap,
    /awesome-agentic-engineering\/langgraph-eval\/<\/loc>/
  );
  assert.match(
    sitemap,
    /awesome-agentic-engineering\/zh\/langgraph-eval\/<\/loc>/
  );
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

test("scorecard and guides link to the LangGraph eval pages", () => {
  assert.match(read("web/index.html"), /href="langgraph-eval\/"/);
  assert.match(read("web/guide/index.html"), /href="\.\.\/langgraph-eval\/"/);
  assert.match(
    read("web/zh/guide/index.html"),
    /href="\.\.\/langgraph-eval\/"/
  );
});
