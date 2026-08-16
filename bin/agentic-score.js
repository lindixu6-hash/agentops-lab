#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const SCORE_AREAS = [
  "goal_clarity",
  "tool_permissions",
  "memory",
  "evals",
  "failure_handling",
  "security",
  "observability",
  "cost_control",
  "human_review",
  "documentation"
];

export const LABELS = {
  goal_clarity: "Goal clarity",
  tool_permissions: "Tool permissions",
  memory: "Memory",
  evals: "Evals",
  failure_handling: "Failure handling",
  security: "Security",
  observability: "Observability",
  cost_control: "Cost control",
  human_review: "Human review",
  documentation: "Documentation"
};

export function ratingFor(total) {
  if (total <= 7) return "demo only";
  if (total <= 14) return "prototype";
  if (total <= 18) return "limited beta";
  return "production candidate";
}

export function loadCard(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  try {
    return JSON.parse(raw);
  } catch (error) {
    throw new Error(`Could not parse JSON in ${filePath}: ${error.message}`);
  }
}

export function scoreCard(card) {
  if (!card || typeof card !== "object") {
    throw new Error("Agent card must be a JSON object.");
  }

  if (!card.scorecard || typeof card.scorecard !== "object") {
    throw new Error("Agent card must include a scorecard object.");
  }

  const rows = SCORE_AREAS.map((area) => {
    const value = card.scorecard[area];
    if (!Number.isInteger(value) || value < 0 || value > 2) {
      throw new Error(`scorecard.${area} must be an integer from 0 to 2.`);
    }
    return {
      area,
      label: LABELS[area],
      value
    };
  });

  const total = rows.reduce((sum, row) => sum + row.value, 0);

  return {
    total,
    max: SCORE_AREAS.length * 2,
    rating: ratingFor(total),
    rows
  };
}

function formatBar(value) {
  return "#".repeat(value).padEnd(2, "-");
}

export function formatReport(card, result) {
  const name = card.name || "Unnamed agent";
  const version = card.version ? ` v${card.version}` : "";
  const lines = [];

  lines.push(`${name}${version}`);
  lines.push("");
  lines.push(`Score: ${result.total}/${result.max}`);
  lines.push(`Rating: ${result.rating}`);
  lines.push("");

  for (const row of result.rows) {
    lines.push(`${formatBar(row.value)} ${row.value}/2  ${row.label}`);
  }

  if (Array.isArray(card.launch_blockers) && card.launch_blockers.length > 0) {
    lines.push("");
    lines.push("Launch blockers:");
    for (const blocker of card.launch_blockers) {
      lines.push(`- ${blocker}`);
    }
  }

  return lines.join("\n");
}

function usage() {
  const script = path.basename(fileURLToPath(import.meta.url));
  return [
    `Usage: ${script} <agent-card.json>`,
    "",
    "Example:",
    `  ${script} examples/coding-agent.card.json`
  ].join("\n");
}

export function main(argv = process.argv) {
  const filePath = argv[2];

  if (!filePath || filePath === "-h" || filePath === "--help") {
    console.log(usage());
    return filePath ? 0 : 1;
  }

  const card = loadCard(filePath);
  const result = scoreCard(card);
  console.log(formatReport(card, result));
  return 0;
}

const isCli =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  try {
    process.exitCode = main(process.argv);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
