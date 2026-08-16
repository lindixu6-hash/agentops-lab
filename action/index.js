#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCard, scoreCard } from "../bin/agentic-score.js";
import { badgeMarkdown } from "../bin/agentic-badge.js";
import { evaluateProfile, loadProfile } from "./profiles.js";

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
    card: inputValue(env, "card", "agent-card.json"),
    profile: inputValue(env, "profile", ""),
    minScore,
    failBelow: parseBoolean(
      inputValue(env, "fail-below", "true"),
      "fail-below"
    ),
    failOnBlockers: parseBoolean(
      inputValue(env, "fail-on-blockers", "false"),
      "fail-on-blockers"
    )
  };
}

function appendLines(filePath, lines) {
  if (!filePath) return;
  fs.appendFileSync(filePath, `${lines.join("\n")}\n`, "utf8");
}

export function launchBlockersFor(card) {
  if (card.launch_blockers === undefined) return [];
  if (!Array.isArray(card.launch_blockers)) {
    throw new Error("launch_blockers must be an array of non-empty strings.");
  }

  const blockers = card.launch_blockers.map((blocker) => {
    if (typeof blocker !== "string" || !blocker.trim()) {
      throw new Error("launch_blockers must be an array of non-empty strings.");
    }
    return blocker.trim();
  });
  return blockers;
}

export function buildSummary(card, result, gate, badge) {
  const scoreStatus = gate.scorePassed ? "PASS" : "FAIL";
  const blockerStatus = gate.blockersPassed ? "PASS" : "FAIL";
  const rows = result.rows
    .map((row) => `| ${row.label} | ${row.value}/2 |`)
    .join("\n");
  const blockerRows =
    gate.blockers.length === 0
      ? ["", "No launch blockers declared."]
      : [
          "",
          "### Launch blockers",
          "",
          ...gate.blockers.map((blocker) => `- ${blocker}`)
        ];
  const profileRows = gate.profile
    ? [
        "",
        "### Risk profile",
        "",
        `- Profile: **${gate.profile.title}** (\`${gate.profile.name}\`)`,
        `- Profile gate: **${gate.profile.passed ? "PASS" : "FAIL"}**`,
        `- Profile minimum total: **${gate.profile.minimumTotal}**`,
        `- Per-area failures: **${gate.profile.areaFailures.length}**`,
        `- Disallowed tool effects: **${gate.profile.effectFailures.length}**`,
        `- Missing required tool effects: **${gate.profile.missingEffects.length}**`,
        `- Missing approvals: **${gate.profile.approvalFailures.length}**`
      ]
    : [];

  return [
    "## Agent Production Readiness Gate",
    "",
    badge,
    "",
    `**${card.name || "Unnamed agent"}** scored **${result.total}/${result.max}**`,
    `with rating **${result.rating}**. Overall gate: **${gate.passed ? "PASS" : "FAIL"}**.`,
    "",
    `- Score gate: **${scoreStatus}** (minimum ${gate.minScore})`,
    `- Launch blocker gate: **${blockerStatus}** (${gate.blockers.length} declared, strict mode ${gate.failOnBlockers ? "on" : "off"})`,
    ...(gate.profile
      ? [`- Risk profile gate: **${gate.profile.passed ? "PASS" : "FAIL"}**`]
      : []),
    "",
    "| Area | Score |",
    "| --- | ---: |",
    rows,
    ...profileRows,
    ...blockerRows
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
  const blockers = launchBlockersFor(card);
  const profileEvaluation = inputs.profile
    ? evaluateProfile(
        card,
        result,
        inputs.profile,
        loadProfile(inputs.profile, options.profileCatalogPath)
      )
    : null;
  const minScore = profileEvaluation
    ? profileEvaluation.minimumTotal
    : inputs.minScore;
  const scorePassed = result.total >= minScore;
  const failOnBlockers =
    inputs.failOnBlockers || profileEvaluation?.blockerPolicy === "fail";
  const blockersPassed = !failOnBlockers || blockers.length === 0;
  const profile = profileEvaluation
    ? {
        ...profileEvaluation,
        passed: profileEvaluation.passed && blockersPassed
      }
    : null;
  const profilePassed = profile ? profile.passed : true;
  const passed = scorePassed && blockersPassed && profilePassed;
  const gate = {
    passed,
    scorePassed,
    blockersPassed,
    blockers,
    blockerCount: blockers.length,
    minScore,
    failOnBlockers,
    profile
  };

  appendLines(env.GITHUB_OUTPUT, [
    `score=${result.total}`,
    `rating=${result.rating}`,
    `badge=${badge}`,
    `passed=${passed}`,
    `profile=${profile?.name || ""}`,
    `profile-passed=${profilePassed}`,
    `blocker-count=${blockers.length}`,
    `blockers=${JSON.stringify(blockers)}`
  ]);
  appendLines(env.GITHUB_STEP_SUMMARY, [buildSummary(card, result, gate, badge)]);

  log(
    `${card.name || "Unnamed agent"}: ${result.total}/${result.max} ` +
      `(${result.rating}), score ${scorePassed ? "PASS" : "FAIL"}, ` +
      `profile ${profile ? `${profile.name} (${profilePassed ? "PASS" : "FAIL"})` : "off"}, ` +
      `blockers ${blockers.length} (${blockersPassed ? "PASS" : "FAIL"}), ` +
      `overall ${passed ? "PASS" : "FAIL"}`
  );

  const failures = [];
  if (!scorePassed && (inputs.failBelow || profile)) {
    failures.push(
      `readiness score ${result.total} is below required ${minScore}`
    );
  }
  if (profile && profile.areaFailures.length > 0) {
    failures.push(
      `profile ${profile.name} area minimums failed: ` +
        profile.areaFailures
          .map((failure) => `${failure.area} ${failure.actual}/${failure.minimum}`)
          .join(", ")
    );
  }
  if (profile && profile.effectFailures.length > 0) {
    failures.push(
      `profile ${profile.name} disallows tool effect(s): ` +
        profile.effectFailures.join(", ")
    );
  }
  if (profile && profile.missingEffects.length > 0) {
    failures.push(
      `profile ${profile.name} requires tool effect(s): ` +
        profile.missingEffects.join(", ")
    );
  }
  if (profile && profile.approvalFailures.length > 0) {
    failures.push(
      `profile ${profile.name} requires approval for: ` +
        profile.approvalFailures.join(", ")
    );
  }
  if (!blockersPassed) {
    failures.push(`${blockers.length} launch blocker(s) remain`);
  }
  if (failures.length > 0) {
    throw new Error(`${failures.join("; ")}.`);
  }

  return {
    ...result,
    badge,
    ...gate
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
