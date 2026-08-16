import assert from "node:assert/strict";
import test from "node:test";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  formatReport,
  loadCard,
  ratingFor,
  scoreCard
} from "../bin/agentic-score.js";

const testDir = path.dirname(fileURLToPath(import.meta.url));

test("ratingFor maps score ranges", () => {
  assert.equal(ratingFor(0), "demo only");
  assert.equal(ratingFor(7), "demo only");
  assert.equal(ratingFor(8), "prototype");
  assert.equal(ratingFor(14), "prototype");
  assert.equal(ratingFor(15), "limited beta");
  assert.equal(ratingFor(18), "limited beta");
  assert.equal(ratingFor(19), "production candidate");
  assert.equal(ratingFor(20), "production candidate");
});

test("scoreCard calculates total score", () => {
  const result = scoreCard({
    scorecard: {
      goal_clarity: 2,
      tool_permissions: 2,
      memory: 1,
      evals: 2,
      failure_handling: 1,
      security: 1,
      observability: 2,
      cost_control: 1,
      human_review: 2,
      documentation: 2
    }
  });

  assert.equal(result.total, 16);
  assert.equal(result.max, 20);
  assert.equal(result.rating, "limited beta");
});

test("scoreCard rejects missing areas", () => {
  assert.throws(
    () => scoreCard({ scorecard: { goal_clarity: 2 } }),
    /scorecard.tool_permissions/
  );
});

test("formatReport includes blockers", () => {
  const card = {
    name: "Test Agent",
    launch_blockers: ["Needs evals"],
    scorecard: {
      goal_clarity: 2,
      tool_permissions: 2,
      memory: 2,
      evals: 2,
      failure_handling: 2,
      security: 2,
      observability: 2,
      cost_control: 2,
      human_review: 2,
      documentation: 2
    }
  };

  const report = formatReport(card, scoreCard(card));
  assert.match(report, /Test Agent/);
  assert.match(report, /Score: 20\/20/);
  assert.match(report, /Needs evals/);
});

test("research agent example is a valid, source-grounded card", () => {
  const card = loadCard(
    path.join(testDir, "../examples/research-agent.card.json")
  );
  const result = scoreCard(card);

  assert.equal(card.name, "Source-Grounded Research Agent");
  assert.equal(result.total, 15);
  assert.equal(result.rating, "limited beta");
  assert.match(card.workflow, /source-linked report/);
  assert.ok(
    card.non_goals.some((item) => item.includes("embedded in retrieved"))
  );
});
