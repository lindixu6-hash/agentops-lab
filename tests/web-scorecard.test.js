import test from "node:test";
import assert from "node:assert/strict";

import {
  AREAS,
  buildAgentCard,
  calculateScore,
  ratingFor
} from "../web/scorecard.js";

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

test("web scorecard exports CLI-compatible scorecard JSON", () => {
  const scores = Object.fromEntries(AREAS.map((area) => [area.id, 1]));
  const card = buildAgentCard(scores);

  assert.equal(card.name, "My AI Agent");
  assert.equal(Object.keys(card.scorecard).length, 10);
  assert.equal(card.scorecard.evals, 1);
});

test("web scorecard rating boundaries match the CLI", () => {
  assert.equal(ratingFor(7), "demo only");
  assert.equal(ratingFor(8), "prototype");
  assert.equal(ratingFor(15), "limited beta");
  assert.equal(ratingFor(19), "production candidate");
});
