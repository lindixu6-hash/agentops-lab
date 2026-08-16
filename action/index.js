#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCard, scoreCard } from "../bin/agentic-score.js";
import { badgeMarkdown } from "../bin/agentic-badge.js";

function inputValue(env, name, fallback = "") {
  const keys = [
    `INPUT_${name.toUpperCase()}`,
    `INPUT_${name.toUpperCase().replaceAll("-", "_")}`
  ];
  const value = keys.map((key) => env[key]).find((item) => item !== undefined);
  return value === undefined || value === "" ? fallback : value;
}

export function parseBoolean(value, name) {
  const normalized = String(value).trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;
  throw new Error(`${name} must be true or false.`);
}

export function readInputs(env = process.env) {
  const minScore = Number(inputValue(env, "min-score", "15"));
  if (!Number.isInteger(minScore) || minScore < 0 || minScore > 20) {
    throw new Error("min-score must be an integer from 0 to 20.");
  }

  return {
    card: inputValue(env, "card", "examples/coding-agent.card.json"),
    minScore,
    failBelow: parseBoolean(
      inputValue(env, "fail-below", "true"),
      "fail-below"
    )
  };
}

function appendLines(filePath, lines) {
  if (!filePath) return;
  fs.appendFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

export function buildSummary(card, result, minScore, badge) {
  const status = result.total >= minScore ? "PASS" : "FAIL";
  const rows = result.rows
    .map((row) => `| ${row.label} | ${row.value}/2 |`)
    .join("\n");

  return [
    "## Agent Production Readiness Gate",
    "",
    badge,
    "",
    `**${card.name || "Unnamed agent"}** scored **${result.total}/${result.max}**`,
    `with rating **${result.rating}**. Gate: **${status}** (minimum ${minScore}).`,
    "",
    "| Area | Score |",
    "| --- | ---: |",
    rows
  ].join("\n");
}

export function runAction(options = {}) {
  const env = options.env || process.env;
  const cwd = options.cwd || process.cwd();
  const log = options.log || console.log;
  const inputs = readInputs(env);
  const cardPath = path.resolve(cwd, inputs.card);

  if (!fs.existsSync(cardPath)) {
    throw new Error(`Agent Card does not exist: ${inputs.card}`);
  }

  const card = loadCard(cardPath);
  const result = scoreCard(card);
  const badge = badgeMarkdown(result);
  const passed = result.total >= inputs.minScore;

  appendLines(env.GITHUB_OUTPUT, [
    `score=${result.total}`,
    `rating=${result.rating}`,
    `badge=${badge}`
  ]);
  appendLines(env.GITHUB_STEP_SUMMARY, [
    buildSummary(card, result, inputs.minScore, badge)
  ]);

  log(
    `${card.name || "Unnamed agent"}: ${result.total}/${result.max} ` +
      `(${result.rating}), minimum ${inputs.minScore}: ${passed ? "PASS" : "FAIL"}`
  );

  if (!passed && inputs.failBelow) {
    throw new Error(
      `Readiness score ${result.total} is below required ${inputs.minScore}.`
    );
  }

  return {
    ...result,
    badge,
    passed,
    minScore: inputs.minScore
  };
}

export function main() {
  try {
    runAction();
  } catch (error) {
    console.error(`::error::${error.message}`);
    process.exitCode = 1;
  }
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) main();
