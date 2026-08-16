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

test("Action manifest exposes independent score and blocker gates", () => {
  const manifest = fs.readFileSync(path.join(projectRoot, "action.yml"), "utf8");

  assert.match(manifest, /fail-below:/);
  assert.match(manifest, /fail-on-blockers:/);
  assert.match(manifest, /profile:/);
  assert.match(manifest, /default: "false"/);
  assert.match(manifest, /blocker-count:/);
  assert.match(manifest, /blockers:/);
  assert.match(manifest, /passed:/);
  assert.match(manifest, /profile-passed:/);
});

test("CI validates local and published eval result contracts", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /npm run validate:results/);
  assert.match(workflow, /agentic-validate-results/);
  assert.match(workflow, /--fixtures evals\/prompt-injection\/fixtures\.jsonl/);
});

test("CI exercises the local risk-profile gate", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /card: examples\/read-only-agent\.card\.json/);
  assert.match(workflow, /profile: "read-only"/);
});

test("CI verifies the published v0 risk-profile outputs", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(
    workflow,
    /uses: lindixu6-hash\/awesome-agentic-engineering@v0/
  );
  assert.match(workflow, /PROFILE_NAME:/);
  assert.match(workflow, /PROFILE_PASSED:/);
  assert.match(workflow, /test "\$PROFILE_NAME" = "read-only"/);
  assert.match(workflow, /test "\$PROFILE_PASSED" = "true"/);
});

test("CI executes and retains provenance-aware reference eval results", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /npm run eval:reference/);
  assert.match(
    workflow,
    /agentic-validate-results artifacts\/reference-eval\/results\.jsonl/
  );
  assert.match(workflow, /uses: actions\/upload-artifact@v7/);
  assert.match(workflow, /name: reference-eval-evidence/);
  assert.match(workflow, /path: artifacts\/reference-eval/);
});

test("CI installs LangGraph and retains external-runtime eval evidence", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /npm run install:langgraph/);
  assert.match(workflow, /npm run eval:langgraph/);
  assert.match(
    workflow,
    /agentic-validate-results artifacts\/langgraph-eval\/results\.jsonl/
  );
  assert.match(workflow, /name: langgraph-eval-evidence/);
  assert.match(workflow, /path: artifacts\/langgraph-eval/);
});
