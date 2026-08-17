# Hacker News Post

Title:

```text
Show HN: A fail-closed production readiness gate for AI agents
```

Body:

```text
I built Awesome Agentic Engineering because most agent readiness checklists stop
at prose. This project turns one into a repository-owned Agent Card and a GitHub
Actions gate.

The initializer deliberately starts at 0/20 with TODOs and an explicit launch
blocker. A high total cannot hide a blocker. Read-only, draft-only, and
state-changing profiles separately constrain tool effects, minimum scores, and
human approval.

The repository also runs the same eight prompt-injection fixtures through three
paths: a deterministic reference runtime, a real LangGraph.js StateGraph, and a
real OpenAI Agents SDK Agent + Runner using an offline custom model. Each path
emits result, assertion, tool-trace, and policy-trace evidence. A separate
SHA-pinned verifier checks a deterministic evidence bundle and its GitHub OIDC
attestation, including negative tamper checks.

This is deliberately a narrow claim. Passing the schemas or attestation does
not prove that an agent is generally safe, and the repository documents that
boundary.

Source and five-minute setup:
https://github.com/lindixu6-hash/awesome-agentic-engineering

Bilingual browser scorecard:
https://lindixu6-hash.github.io/awesome-agentic-engineering/

The CLI is zero-dependency, the current release is v0.15.0, and the test suite
has 145 deterministic tests. English and Simplified Chinese documentation are
maintained together.

I would especially value feedback on the Agent Card contract, whether the risk
profiles match real deployment boundaries, and which runtime integration would
be most useful next.
```
