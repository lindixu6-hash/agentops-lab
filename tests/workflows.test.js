import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);

function readWorkflow(name) {
  return fs.readFileSync(
    path.join(projectRoot, ".github", "workflows", name),
    "utf8"
  );
}

test("Star Watch preserves its hidden JSON snapshot in the artifact", () => {
  const workflow = readWorkflow("star-watch.yml");

  assert.match(workflow, /uses: actions\/upload-artifact@v7/);
  assert.match(workflow, /include-hidden-files: true/);
  assert.match(workflow, /path: \|\n\s+\.star-watch\.json\n\s+star-watch\.txt/);
});

test("Star Watch keeps the scheduled 1000-star monitor enabled", () => {
  const workflow = readWorkflow("star-watch.yml");

  assert.match(workflow, /cron: "17 1 \* \* \*"/);
  assert.match(workflow, /workflow_dispatch:/);
  assert.match(workflow, /--target 1000/);
});
