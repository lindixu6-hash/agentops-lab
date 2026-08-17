import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  AGENT_CARD_SCHEMA_URL,
  AREAS,
  buildShareText,
  buildAgentCard,
  calculateScore,
  decodeScores,
  encodeScores,
  ratingFor
} from "../web/scorecard.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));
const pageHtml = fs.readFileSync(
  path.join(testDir, "../web/index.html"),
  "utf8"
);

test("web scorecard exposes all ten production areas", () => {
  assert.equal(AREAS.length, 10);
  assert.equal(new Set(AREAS.map((area) => area.id)).size, 10);
});

test("web scorecard calculates rating and priority gaps", () => {
  const scores = Object.fromEntries(AREAS.map((area) => [area.id, 2]));
  scores.security = 0;
  scores.cost_control = 1;

  const result = calculateScore(scores);

  assert.equal(result.total, 17);
  assert.equal(result.rating, "limited beta");
  assert.equal(result.gaps[0].id, "security");
});

test("web scorecard exports a schema-valid fail-closed Agent Card", () => {
  const scores = Object.fromEntries(AREAS.map((area) => [area.id, 1]));
  const card = buildAgentCard(scores);
  const schema = JSON.parse(
    fs.readFileSync(
      path.join(testDir, "../schema/agent-card.schema.json"),
      "utf8"
    )
  );

  assert.equal(card.$schema, AGENT_CARD_SCHEMA_URL);
  assert.equal(card.name, "My AI Agent");
  for (const field of schema.required) {
    assert.ok(Object.hasOwn(card, field), `missing schema field: ${field}`);
  }
  assert.equal(Object.keys(card.scorecard).length, 10);
  assert.equal(card.scorecard.evals, 1);
  assert.match(JSON.stringify(card), /TODO/);
  assert.equal(card.launch_blockers.length, 1);
});

test("web scorecard rating boundaries match the CLI", () => {
  assert.equal(ratingFor(7), "demo only");
  assert.equal(ratingFor(8), "prototype");
  assert.equal(ratingFor(15), "limited beta");
  assert.equal(ratingFor(19), "production candidate");
});

test("web scorecard encodes and restores shareable scores", () => {
  const scores = Object.fromEntries(
    AREAS.map((area, index) => [area.id, index % 3])
  );
  const encoded = encodeScores(scores);

  assert.equal(encoded.length, 10);
  assert.deepEqual(decodeScores(encoded), scores);
  assert.equal(decodeScores("220bad"), null);
});

test("web scorecard builds English and Chinese share copy", () => {
  const result = { total: 16, max: 20, rating: "limited beta" };

  assert.match(buildShareText(result, "en"), /16\/20/);
  assert.match(buildShareText(result, "zh"), /16\/20/);
  assert.match(buildShareText(result, "zh"), /有限 Beta/);
});

test("web scorecard exposes social preview metadata", () => {
  assert.match(pageHtml, /property="og:image"/);
  assert.match(pageHtml, /name="twitter:card" content="summary_large_image"/);
  assert.match(pageHtml, /assets\/social-preview\.png/);
});
