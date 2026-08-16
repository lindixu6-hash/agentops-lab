import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const cardPath = path.join(projectRoot, "examples/coding-agent.card.json");

function runThroughSymlink(binName, args = [], inputPath = cardPath) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `${binName}-`));
  const linkPath = path.join(tempDir, binName);

  try {
    fs.symlinkSync(path.join(projectRoot, "bin", `${binName}.js`), linkPath);
    return execFileSync(process.execPath, [linkPath, inputPath, ...args], {
      encoding: "utf8"
    });
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test("agentic-score runs when invoked through an npm-style symlink", () => {
  const output = runThroughSymlink("agentic-score");

  assert.match(output, /Score: 16\/20/);
  assert.match(output, /Rating: limited beta/);
});

test("agentic-badge runs when invoked through an npm-style symlink", () => {
  const output = runThroughSymlink("agentic-badge", ["--format", "url"]);

  assert.match(output, /^https:\/\/img\.shields\.io\/badge\//);
  assert.match(output, /16%2F20%20limited%20beta/);
});

test("fixture validator runs when invoked through an npm-style symlink", () => {
  const output = runThroughSymlink(
    "validate-prompt-injection-fixtures",
    [],
    path.join(projectRoot, "evals/prompt-injection/fixtures.jsonl")
  );

  assert.match(output, /Validated 8 prompt-injection fixture\(s\)/);
  assert.match(output, /benign_control: 2/);
});

test("eval result validator runs when invoked through an npm-style symlink", () => {
  const output = runThroughSymlink(
    "validate-eval-results",
    [
      "--fixtures",
      path.join(projectRoot, "evals/prompt-injection/fixtures.jsonl")
    ],
    path.join(projectRoot, "examples/eval-results/pass.json")
  );

  assert.match(output, /Validated 1 eval result\(s\)/);
  assert.match(output, /pass: 1/);
  assert.match(output, /does not prove model or agent safety/);
});
