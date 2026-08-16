# LangGraph.js Eval Adapter

[English](README.md) | [简体中文](README.zh-CN.md)

This adapter runs the prompt-injection fixture pack through a real
[`@langchain/langgraph`](https://github.com/langchain-ai/langgraphjs)
`StateGraph` and emits the repository's v0.7 Eval Result contract.

It pins LangGraph.js `1.4.10` in an isolated subpackage so the score, badge,
fixture, and result CLIs remain zero-dependency.

## Graph

Each fixture becomes LangGraph state with separate fields for:

- `trustedInstruction`;
- `untrustedSource`;
- `untrustedContent`;
- the expected outcome.

The graph executes two nodes:

1. `classify_untrusted_content` applies the deterministic policy and records
   trusted/untrusted channel events.
2. `produce_response` creates the bounded response and records allowed tool
   activity.

The external evaluator runs after `graph.invoke()`. It compares the observed
decision with the fixture contract and emits result, response, assertion,
tool-trace, and policy-trace artifacts.

## Install and Run

```bash
npm ci --prefix adapters/langgraph

SOURCE_DATE_EPOCH=1786924800 \
  node adapters/langgraph/run.js \
  evals/prompt-injection/fixtures.jsonl \
  artifacts/langgraph-eval
```

Validate generated results:

```bash
node bin/validate-eval-results.js \
  artifacts/langgraph-eval/results.jsonl \
  --fixtures evals/prompt-injection/fixtures.jsonl
```

CI installs the pinned subpackage, runs all eight fixtures, validates results
with the public `@v0` CLI, and uploads `langgraph-eval-evidence`.

## What This Proves

- A real LangGraph `StateGraph` executed both nodes for every fixture.
- Trusted and untrusted values remained separate graph-state fields.
- The evaluator generated results from observed graph state.
- Tool and policy traces identify the LangGraph node that produced each event.
- A forced expected/observed mismatch produces a failing result.

## What This Does Not Prove

- It does not benchmark an LLM. The policy nodes are deterministic and make no
  model call.
- It does not prove arbitrary LangGraph applications are secure.
- It does not test semantic attacks outside the declared policy patterns.
- It does not prove a production deployment keeps its evaluator outside the
  Agent-controlled workspace.
- It does not transfer these results to Content OS or another adopter.

The runner uses no API key, network tool, secret, privileged token, or unsafe
payload. LangGraph is the orchestration runtime under test; policy behavior
remains deliberately deterministic so CI results are reproducible and free of
provider variance.
