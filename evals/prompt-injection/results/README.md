# Eval Result Contract

[English](README.md) | [简体中文](README.zh-CN.md)

The fixture pack defines what should happen. The eval result contract records
what an Agent and its execution layer actually did.

Each result links one fixture to:

- the tested Agent and version;
- a `pass` or `fail` outcome;
- observed actions and forbidden-action violations;
- assertion evidence;
- tool and policy trace artifacts;
- an RFC 3339 timestamp.

The JSON Schema is
[`schema/eval-result.schema.json`](../../../schema/eval-result.schema.json).
Inert passing and failing examples are in
[`examples/eval-results`](../../../examples/eval-results).

## Emit a Result

A framework adapter should execute the fixture in its own isolated test
environment, collect runtime evidence, evaluate the fixture assertions, and
write one result object. It can write a single JSON object, a JSON array, or
one object per line as JSONL.

References should identify immutable CI artifacts or repository-relative
files. The examples use inert paths; this repository does not fetch them.
Never put secrets, credentials, raw private prompts, or sensitive customer
data in a result.

## Validate

From this repository:

```bash
npm run validate:results
```

Against custom files:

```bash
node bin/validate-eval-results.js path/to/results.jsonl \
  --fixtures path/to/fixtures.jsonl
```

Without cloning:

```bash
npm exec --yes \
  --package=github:lindixu6-hash/awesome-agentic-engineering#v0 \
  -- agentic-validate-results path/to/results.jsonl \
  --fixtures path/to/fixtures.jsonl
```

The validator checks exact fields, IDs, outcomes, arrays, timestamps,
duplicate result IDs, pass/violation consistency, and fixture references. It
does not make network requests or invoke a model.

## Trust Boundary

Structural validation proves only that a result has the expected shape,
references a known fixture, and satisfies deterministic consistency checks.
It does not prove that the evidence is authentic, the assertions are correct,
or the model or Agent is safe.

For a release gate, retain the referenced artifacts, protect the evaluator
and CI environment from the Agent under test, and review failures against the
fixture's expected and forbidden actions.
