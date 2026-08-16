# Contributing

[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

Thanks for helping improve Awesome Agentic Engineering. This repository values
executable, source-backed production evidence over feature counts or broad
claims.

## Contribution Paths

### Adopt the readiness gate

Use the
[Agent Card adoption form](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/new?template=agent-card-adoption.yml)
when another public repository uses an Agent Card, score gate, risk profile,
fixture contract, or result validator.

Provide:

- the consumer repository and public workflow run;
- the bounded Agent workflow and selected risk profile;
- the actual score, blockers, and failing gates;
- maintainer affiliation and any shared ownership.

Passing is not required. A real failing audit with visible debt is stronger
evidence than a hand-edited green badge.

### Add a runtime adapter

Comment on
[the runtime adapter issue](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/14)
before implementation, or use the
[runtime adapter proposal form](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/new?template=runtime-adapter.yml).

An adapter must:

- pin an actively maintained open-source runtime;
- execute the runtime's real orchestration primitive;
- keep trusted and source-labeled untrusted values separate;
- run all eight malicious and benign fixtures;
- generate results from observed state, not hand-authored verdicts;
- retain response, assertion, tool-trace, and policy-trace artifacts in CI;
- include a negative regression that produces `fail`;
- keep evaluator assertions outside the Agent-controlled path;
- use no live secret, privileged token, model API key, or unsafe payload.

### Add a production incident

Use the production failure form. Link primary sources and distinguish a real
incident, disclosed vulnerability, red-team demonstration, and research PoC.
Convert the evidence into detection signals, controls, and Given/When/Then
regressions.

### Improve a contract, pattern, or guide

Useful contributions include:

- repeatable eval scenarios and benign controls;
- permission, approval, memory, cost, and recovery boundaries;
- source-linked incident regressions;
- machine-readable schemas and validators;
- narrow examples with public CI evidence;
- corrections to English or Chinese documentation.

## English and Chinese

User-facing workflows must keep English and Simplified Chinese navigation in
sync. A contribution does not need a literal line-by-line translation, but it
must provide:

- an English entry and a Simplified Chinese entry, or a clear follow-up plan
  agreed with maintainers;
- reciprocal language links;
- the same capability, limitation, and safety claims in both languages.

Machine-readable schemas, JSONL fixtures, source code, and CLI output remain
language-neutral.

## Evidence Rules

- Separate observed behavior from interpretation.
- Keep unresolved launch blockers visible.
- Do not infer production adoption from Stars, CI status, examples, or
  self-operated evidence.
- Do not claim that structural validation proves Agent safety.
- Do not present deterministic policy adapters as LLM benchmarks.
- Disclose when the contributor maintains both this repository and the
  consumer or submitted project.

## Local Verification

Use Node.js 20 or newer:

```bash
npm run install:langgraph
npm test
npm run validate:fixtures
npm run validate:results
```

When changing the LangGraph adapter:

```bash
SOURCE_DATE_EPOCH=1786924800 npm run eval:langgraph
node bin/validate-eval-results.js \
  artifacts/langgraph-eval/results.jsonl \
  --fixtures evals/prompt-injection/fixtures.jsonl
```

For every change:

```bash
git diff --check
```

## Pull Requests

- Keep one behavioral purpose per pull request.
- Link the issue or evidence that motivates the change.
- Include tests proportional to the risk.
- Preserve unrelated worktree changes.
- State limitations and work that remains.
- Do not update generated counts, scores, or claims without recomputing them.

## Not Accepted

- fabricated benchmarks or adoption claims;
- paid placement, affiliate links, engagement exchange, or Star trading;
- live secrets, working exfiltration endpoints, or unsafe payload execution;
- a high readiness score created by hiding blockers or inflating evidence;
- dependency or metadata churn unrelated to the contribution.

## Security

Do not open a public issue for a vulnerability that could expose users. Follow
[SECURITY.md](SECURITY.md).

## License

By contributing, you agree that your contribution is licensed under the
repository's MIT License.
