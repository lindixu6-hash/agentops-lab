#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { loadCard, scoreCard } from "./agentic-score.js";

const COLOR_BY_RATING = {
  "demo only": "9f3a38",
  prototype: "c67c15",
  "limited beta": "287a50",
  "production candidate": "1769aa"
};

function shieldEscape(value) {
  return encodeURIComponent(String(value).replaceAll("-", "--"));
}

export function badgeUrl(result, options = {}) {
  const label = options.label || "agent readiness";
  const message = `${result.total}/${result.max} ${result.rating}`;
  const color = COLOR_BY_RATING[result.rating] || "555";

  return (
    "https://img.shields.io/badge/" +
    `${shieldEscape(label)}-${shieldEscape(message)}-${color}` +
    "?style=flat-square"
  );
}

export function badgeMarkdown(result, options = {}) {
  const alt = options.alt || "Agent production readiness";
  const url = badgeUrl(result, options);
  return `![${alt}](${url})`;
}

export function parseArgs(argv) {
  const args = {
    file: "",
    format: "markdown",
    label: "agent readiness"
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("-") && !args.file) {
      args.file = value;
      continue;
    }
    if (value === "--format") {
      args.format = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (value === "--label") {
      args.label = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (value === "-h" || value === "--help") {
      args.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${value}`);
  }

  if (!["markdown", "url", "json"].includes(args.format)) {
    throw new Error("--format must be markdown, url, or json.");
  }
  if (!args.label.trim()) {
    throw new Error("--label cannot be empty.");
  }

  return args;
}

function usage() {
  return [
    "Usage: agentic-badge <agent-card.json> [options]",
    "",
    "Options:",
    "  --format markdown|url|json  Output format (default: markdown)",
    '  --label "text"              Badge label',
    "  -h, --help                  Show help",
    "",
    "Examples:",
    "  agentic-badge examples/coding-agent.card.json",
    "  agentic-badge examples/coding-agent.card.json --format url"
  ].join("\n");
}

export function main(argv = process.argv) {
  const args = parseArgs(argv);
  if (args.help || !args.file) {
    console.log(usage());
    return args.help ? 0 : 1;
  }

  const card = loadCard(args.file);
  const result = scoreCard(card);
  const options = { label: args.label };
  const url = badgeUrl(result, options);

  if (args.format === "url") {
    console.log(url);
  } else if (args.format === "json") {
    console.log(
      JSON.stringify(
        {
          score: result.total,
          max: result.max,
          rating: result.rating,
          markdown: badgeMarkdown(result, options),
          url
        },
        null,
        2
      )
    );
  } else {
    console.log(badgeMarkdown(result, options));
  }

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
