#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { SCORE_AREAS } from "./agentic-score.js";

export const AGENT_CARD_SCHEMA_URL =
  "https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/agent-card.schema.json";
export const PROFILES = ["read-only", "draft-only", "state-changing"];

const TOOL_BY_PROFILE = {
  "read-only": {
    name: "replace_with_read_tool",
    purpose: "TODO: describe the allowlisted data this tool may read",
    access: "read",
    effect: "read_only",
    approval_required: false
  },
  "draft-only": {
    name: "replace_with_draft_workspace",
    purpose: "TODO: describe the isolated, non-published draft workspace",
    access: "write",
    effect: "draft",
    approval_required: false
  },
  "state-changing": {
    name: "replace_with_state_changing_tool",
    purpose: "TODO: describe the external state change and rollback path",
    access: "write",
    effect: "external_state",
    approval_required: true
  }
};

export function parseArgs(argv = process.argv) {
  const options = {
    profile: "read-only",
    name: "Starter Agent",
    force: false,
    help: false
  };

  for (let index = 2; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--profile") {
      options.profile = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (value === "--name") {
      options.name = argv[index + 1] || "";
      index += 1;
      continue;
    }
    if (value === "--force") {
      options.force = true;
      continue;
    }
    if (value === "-h" || value === "--help") {
      options.help = true;
      continue;
    }
    throw new Error(`Unknown argument: ${value}`);
  }

  if (!PROFILES.includes(options.profile)) {
    throw new Error(`--profile must be one of ${PROFILES.join(", ")}.`);
  }
  if (!options.name.trim()) {
    throw new Error("--name cannot be empty.");
  }
  options.name = options.name.trim();
  return options;
}

export function starterCard(options) {
  return {
    $schema: AGENT_CARD_SCHEMA_URL,
    name: options.name,
    version: "0.1",
    owner: "TODO: team or maintainer",
    users: ["TODO: intended user"],
    workflow:
      "TODO: define one bounded workflow, its input, output, and success condition",
    risk_profile: options.profile,
    non_goals: [
      "TODO: name at least one action this agent must never take"
    ],
    tools: [{ ...TOOL_BY_PROFILE[options.profile] }],
    launch_blockers: [
      "Starter card: replace every TODO and attach repeatable evidence before release"
    ],
    scorecard: Object.fromEntries(SCORE_AREAS.map((area) => [area, 0]))
  };
}

export function starterWorkflow(options) {
  return `name: Agent Production Readiness

on:
  push:
    paths:
      - "agent-card.json"
      - ".github/workflows/agent-readiness.yml"
  pull_request:
    paths:
      - "agent-card.json"
      - ".github/workflows/agent-readiness.yml"
  workflow_dispatch:

permissions:
  contents: read

jobs:
  readiness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: lindixu6-hash/awesome-agentic-engineering@v0
        with:
          card: agent-card.json
          profile: "${options.profile}"
          fail-on-blockers: "true"
`;
}

export function initStarter(options, cwd = process.cwd()) {
  const cardPath = path.join(cwd, "agent-card.json");
  const workflowPath = path.join(
    cwd,
    ".github",
    "workflows",
    "agent-readiness.yml"
  );
  const existing = [cardPath, workflowPath].filter((filePath) =>
    fs.existsSync(filePath)
  );
  if (existing.length > 0 && !options.force) {
    throw new Error(
      "Refusing to overwrite existing file(s): " +
        existing.map((filePath) => path.relative(cwd, filePath)).join(", ") +
        ". Use --force only after reviewing those files."
    );
  }

  fs.mkdirSync(path.dirname(workflowPath), { recursive: true });
  fs.writeFileSync(
    cardPath,
    `${JSON.stringify(starterCard(options), null, 2)}\n`,
    "utf8"
  );
  fs.writeFileSync(workflowPath, starterWorkflow(options), "utf8");
  return { cardPath, workflowPath };
}

function usage() {
  return [
    "Usage: agentic-init [options]",
    "",
    "Create a fail-closed agent-card.json and GitHub Actions workflow.",
    "",
    "Options:",
    "  --profile read-only|draft-only|state-changing",
    '  --name "Agent name"',
    "  --force     Overwrite both generated paths after explicit review",
    "  -h, --help  Show help",
    "",
    "Example:",
    '  agentic-init --profile draft-only --name "Support Drafting Agent"'
  ].join("\n");
}

export function main(argv = process.argv, cwd = process.cwd()) {
  const options = parseArgs(argv);
  if (options.help) {
    console.log(usage());
    return 0;
  }

  const created = initStarter(options, cwd);
  console.log(`Created ${path.relative(cwd, created.cardPath)}`);
  console.log(`Created ${path.relative(cwd, created.workflowPath)}`);
  console.log(
    "The starter intentionally fails: replace every TODO, attach evidence, " +
      "set honest scores, and remove the launch blocker only when resolved."
  );
  return 0;
}

const isCli =
  process.argv[1] &&
  fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url);

if (isCli) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}
