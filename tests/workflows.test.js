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

test("CI parses every community YAML form", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /name: Validate community YAML/);
  assert.match(workflow, /require "yaml"/);
  assert.match(workflow, /ISSUE_TEMPLATE\/\*\.\{yml,yaml\}/);
  assert.match(workflow, /YAML\.safe_load/);
});

test("CI verifies generated starters fail closed", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /bin\/agentic-init\.js/);
  assert.match(workflow, /card: \.tmp-init\/agent-card\.json/);
  assert.match(workflow, /id: starter-gate/);
  assert.match(workflow, /test "\$STEP_OUTCOME" = "failure"/);
  assert.match(workflow, /test "\$SCORE" = "0"/);
  assert.match(workflow, /test "\$PROFILE_PASSED" = "false"/);
  assert.match(workflow, /test "\$BLOCKER_COUNT" = "1"/);
});

test("CI smoke tests the published v0 initializer", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /name: Test published v0 initializer/);
  assert.match(workflow, /agentic-init/);
  assert.match(
    workflow,
    /--package=github:lindixu6-hash\/awesome-agentic-engineering#v0/
  );
  assert.match(workflow, /card\.risk_profile !== "read-only"/);
  assert.match(workflow, /card\.launch_blockers\.length !== 1/);
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

test("CI installs OpenAI Agents and retains offline Runner evidence", () => {
  const workflow = readWorkflow("ci.yml");

  assert.match(workflow, /npm run install:openai-agents/);
  assert.match(workflow, /npm run eval:openai-agents/);
  assert.match(
    workflow,
    /agentic-validate-results \\\n\s+artifacts\/openai-agents-eval\/results\.jsonl/
  );
  assert.match(workflow, /uses: actions\/upload-artifact@v7/);
  assert.match(workflow, /name: openai-agents-eval-evidence/);
  assert.match(workflow, /path: artifacts\/openai-agents-eval/);
});

test("reusable verifier pins code, actions, identity, and negative checks", () => {
  const workflow = readWorkflow("verify-eval-evidence.yml");

  assert.match(workflow, /workflow_call:/);
  assert.match(
    workflow,
    /ref: 34b12355a27a647adfb5b09578234a19ee076f0f/
  );
  assert.match(
    workflow,
    /actions\/checkout@fbc6f3992d24b796d5a048ff273f7fcc4a7b6c09/
  );
  assert.match(
    workflow,
    /actions\/download-artifact@3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c/
  );
  assert.match(
    workflow,
    /actions\/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a/
  );
  assert.match(workflow, /--signer-workflow/);
  assert.match(workflow, /--signer-digest "\$GITHUB_SHA"/);
  assert.match(workflow, /--source-digest "\$GITHUB_SHA"/);
  assert.match(workflow, /--source-ref "\$GITHUB_REF"/);
  assert.match(workflow, /--deny-self-hosted-runners/);
  assert.match(workflow, /Tampered bundle unexpectedly verified/);
  assert.match(workflow, /Wrong source digest unexpectedly verified/);
  assert.match(workflow, /eval-evidence-provenance\.js/);
  assert.doesNotMatch(workflow, /uses: [^\n]+@v\d/);
});

test("producer attests one bundle before calling immutable verifier", () => {
  const workflow = readWorkflow("provenance-eval.yml");

  assert.match(workflow, /github\.ref == 'refs\/heads\/main'/);
  assert.match(workflow, /attestations: write/);
  assert.match(workflow, /id-token: write/);
  assert.match(workflow, /eval-evidence-provenance\.js \\\n\s+build/);
  assert.match(
    workflow,
    /awesome-agentic-engineering#ceaaaa58373c5603b4a28d3d650787a2117e533b/
  );
  assert.match(workflow, /--sort=name/);
  assert.match(workflow, /openai-agents-evidence\.tar\.gz/);
  assert.match(
    workflow,
    /actions\/attest@1e69f48acb82d1966a394da916b4c1698aa569d6/
  );
  assert.match(workflow, /needs: produce/);
  assert.match(
    workflow,
    /verify-eval-evidence\.yml@8d4b435f66f58a570b65dd8b4952bf7e1e2dd62f/
  );
  assert.doesNotMatch(workflow, /uses: [^\n]+@v\d/);
});
