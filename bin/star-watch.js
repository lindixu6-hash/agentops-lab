#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export function parseRepo(input) {
  if (!input) {
    throw new Error("Pass a repo as owner/name or https://github.com/owner/name.");
  }

  const trimmed = input.trim().replace(/\/$/, "").replace(/\.git$/, "");
  const urlMatch = trimmed.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/);
  if (urlMatch) {
    return `${urlMatch[1]}/${urlMatch[2]}`;
  }

  if (/^[^/\s]+\/[^/\s]+$/.test(trimmed)) {
    return trimmed;
  }

  throw new Error("Repo must be owner/name or https://github.com/owner/name.");
}

export function parseArgs(argv) {
  const options = {
    format: "json",
    statePath: null,
    target: 1000,
    repo: null
  };

  const args = argv.slice(2);
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--state") {
      options.statePath = args[index + 1];
      index += 1;
      continue;
    }

    if (arg === "--target") {
      options.target = Number.parseInt(args[index + 1], 10);
      index += 1;
      continue;
    }

    if (arg === "--text") {
      options.format = "text";
      continue;
    }

    if (arg === "--json") {
      options.format = "json";
      continue;
    }

    if (arg === "-h" || arg === "--help") {
      options.help = true;
      continue;
    }

    if (!options.repo) {
      options.repo = arg;
      continue;
    }

    throw new Error(`Unexpected argument: ${arg}`);
  }

  if (!Number.isInteger(options.target) || options.target < 1) {
    throw new Error("--target must be a positive integer.");
  }

  return options;
}

export async function getRepo(repo) {
  const response = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "User-Agent": "awesome-agentic-engineering-star-watch"
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${repo}.`);
  }

  return response.json();
}

export function readPreviousSnapshot(statePath) {
  if (!statePath || !fs.existsSync(statePath)) {
    return null;
  }

  const raw = fs.readFileSync(statePath, "utf8");
  return JSON.parse(raw);
}

export function writeSnapshot(statePath, snapshot) {
  if (!statePath) {
    return;
  }

  fs.mkdirSync(path.dirname(statePath), { recursive: true });
  fs.writeFileSync(statePath, `${JSON.stringify(snapshot, null, 2)}\n`);
}

export function buildSnapshot(repo, data, previous, target = 1000) {
  const stars = data.stargazers_count;
  const previousStars = previous?.stars ?? null;
  const deltaStars = previousStars === null ? null : stars - previousStars;
  const remainingToTarget = Math.max(target - stars, 0);

  return {
    repo,
    stars,
    previous_stars: previousStars,
    delta_stars: deltaStars,
    forks: data.forks_count,
    open_issues: data.open_issues_count,
    pushed_at: data.pushed_at,
    target_stars: target,
    remaining_to_target: remainingToTarget,
    reached_target: stars >= target,
    checked_at: new Date().toISOString()
  };
}

export function formatText(snapshot) {
  const delta = snapshot.delta_stars === null
    ? "first check"
    : `${snapshot.delta_stars >= 0 ? "+" : ""}${snapshot.delta_stars} since last check`;

  return [
    `${snapshot.repo}`,
    `Stars: ${snapshot.stars} (${delta})`,
    `Forks: ${snapshot.forks}`,
    `Open issues: ${snapshot.open_issues}`,
    `Target: ${snapshot.target_stars}`,
    `Remaining: ${snapshot.remaining_to_target}`,
    `Checked: ${snapshot.checked_at}`
  ].join("\n");
}

export function usage() {
  const script = path.basename(fileURLToPath(import.meta.url));
  return [
    `Usage: ${script} <owner/repo|github-url> [--state .star-watch.json] [--target 1000] [--json|--text]`,
    "",
    "Examples:",
    `  ${script} openai/openai-node`,
    `  ${script} https://github.com/openai/openai-node --state .star-watch.json --target 1000 --text`
  ].join("\n");
}

export async function main(argv = process.argv) {
  const options = parseArgs(argv);

  if (options.help) {
    console.log(usage());
    return 0;
  }

  const repo = parseRepo(options.repo || process.env.GITHUB_REPOSITORY || "");
  const previous = readPreviousSnapshot(options.statePath);
  const data = await getRepo(repo);
  const snapshot = buildSnapshot(repo, data, previous, options.target);

  writeSnapshot(options.statePath, snapshot);

  if (options.format === "text") {
    console.log(formatText(snapshot));
  } else {
    console.log(JSON.stringify(snapshot, null, 2));
  }

  return 0;
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  try {
    process.exitCode = await main(process.argv);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
