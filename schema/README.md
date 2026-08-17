# Machine-Readable Schemas

[English](README.md) | [简体中文](README.zh-CN.md)

GitHub Pages serves the current schema contracts directly:

- [Agent Card](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/agent-card.schema.json)
- [Prompt-injection fixture](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/prompt-injection-fixture.schema.json)
- [Eval Result](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/eval-result.schema.json)
- [Readiness profile catalog](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/readiness-profiles.schema.json)

These canonical URLs track the current `main` contract. Use them during active
development when receiving compatible schema improvements is desirable.

## Pin External Adopters

An external repository should normally pin the release that its checked-in
card was reviewed against:

```json
{
  "$schema": "https://raw.githubusercontent.com/lindixu6-hash/awesome-agentic-engineering/v0.15.0/schema/agent-card.schema.json",
  "name": "Research Drafting Agent",
  "owner": "Research platform",
  "workflow": "Gather scoped evidence and create a draft report.",
  "scorecard": {
    "goal_clarity": 0,
    "tool_permissions": 0,
    "memory": 0,
    "evals": 0,
    "failure_handling": 0,
    "security": 0,
    "observability": 0,
    "cost_control": 0,
    "human_review": 0,
    "documentation": 0
  }
}
```

An immutable tag prevents a future schema change from silently changing the
meaning of an already-reviewed pull request. Upgrade the URL deliberately when
reviewing a new contract release.

## Interpretation Limits

- JSON Schema validates structure, not evidence authenticity or Agent safety.
- A valid card can still contain unsupported scores or incomplete tool
  declarations.
- The score gate and risk-profile gate remain separate from schema validation.
- A high total never overrides an explicit launch blocker.
- Keep observed evidence, limitations, maintainer affiliation, and unresolved
  failures visible in adoption pull requests.
