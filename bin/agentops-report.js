#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  buildMarkdownReport,
  evaluateInput
} from "../lib/agentops-report.js";

function usage() {
  return `AgentOps Lab report generator

Usage:
  agentops-report <input.csv|input.json> [--output report.md] [--json metrics.json]

Options:
  --output, -o  Markdown report path (default: agentops-report.md)
  --json        Optional machine-readable metrics output
  --help, -h    Show this help
`;
}

function parseArgs(argv) {
  const options = {
    input: "",
    output: "agentops-report.md",
    json: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    } else if (arg === "--output" || arg === "-o") {
      options.output = argv[index + 1] || "";
      index += 1;
    } else if (arg === "--json") {
      options.json = argv[index + 1] || "";
      index += 1;
    } else if (!arg.startsWith("-") && !options.input) {
      options.input = arg;
    } else {
      throw new Error(`Unknown or incomplete argument: ${arg}`);
    }
  }

  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    console.error(error.message);
    console.error(usage());
    return 1;
  }

  if (options.help) {
    console.log(usage());
    return 0;
  }

  if (!options.input || !options.output) {
    console.error("An input file and a non-empty output path are required.");
    console.error(usage());
    return 1;
  }

  try {
    const inputPath = path.resolve(options.input);
    const source = path.basename(inputPath);
    const text = fs.readFileSync(inputPath, "utf8");
    const result = evaluateInput(text, source);
    const report = buildMarkdownReport(result.metrics, { source });

    fs.writeFileSync(path.resolve(options.output), report, "utf8");
    if (options.json) {
      fs.writeFileSync(
        path.resolve(options.json),
        `${JSON.stringify(result.metrics, null, 2)}\n`,
        "utf8"
      );
    }

    console.log(
      `Analyzed ${result.metrics.total} runs: ${result.metrics.success_rate}% success, ${result.metrics.failure_count} failures.`
    );
    console.log(`Markdown report: ${path.resolve(options.output)}`);
    if (options.json) console.log(`JSON metrics: ${path.resolve(options.json)}`);
    return 0;
  } catch (error) {
    console.error(`AgentOps report failed: ${error.message}`);
    return 1;
  }
}

process.exitCode = main();

