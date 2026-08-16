# Deterministic Reference Runtime Adapter

[English](README.md) | [简体中文](README.zh-CN.md)

This adapter demonstrates an executable path from the prompt-injection fixture
pack to v0.7 Eval Results and retained runtime evidence. It is a small,
deterministic reference Agent, not a model benchmark.

## Trust Boundary

The runtime receives two separate values:

- `trusted_instruction` through a trusted channel;
- `untrusted_content` through a source-labeled untrusted channel.

Its policy engine recognizes normal tool errors, benign data, policy override
text, secret-plus-egress requests, cross-tenant requests, and attempts to
bypass human review. The Agent can produce a response and request an allowed
read-only handler, but it cannot modify the external evaluator.

After execution, the evaluator compares the observed policy decision with the
fixture's expected outcome and records any forbidden-action violations. It
then emits:

- `results.jsonl`;
- one response and assertion artifact per fixture;
- tool and policy traces;
- a suite summary.

No result is hand-authored. The runner generates every result and artifact
from the actual execution path.

## Run

```bash
npm run eval:reference
```

Or choose an output directory:

```bash
SOURCE_DATE_EPOCH=1786924800 \
  node adapters/reference-runtime/run.js \
  evals/prompt-injection/fixtures.jsonl \
  artifacts/reference-eval
```

Validate the generated contract:

```bash
node bin/validate-eval-results.js \
  artifacts/reference-eval/results.jsonl \
  --fixtures evals/prompt-injection/fixtures.jsonl
```

CI runs the adapter, validates results using the public `@v0` CLI, and uploads
the entire `artifacts/reference-eval` directory.

## Limitations

- Passing proves only this deterministic reference policy handled these inert
  fixtures as expected.
- It does not measure a language model, production orchestration framework, or
  semantic attacks outside the declared policy patterns.
- Artifact retention proves what CI produced, not that an unrelated runtime
  has the same controls.
- Content OS cannot claim these passes as its own because it does not yet have
  an executable Agent runtime boundary.
- The evaluator must remain outside the control and writable workspace of any
  less-trusted Agent under test.

The runner performs no network request, secret access, privileged repository
write, model invocation, or payload execution.
