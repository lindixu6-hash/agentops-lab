# Risk-Tiered Readiness Profiles

[English](README.md) | [简体中文](README.zh-CN.md)

A single total score hides different failure costs. These opt-in profiles add
minimum per-area scores, tool-effect boundaries, approval requirements, and a
launch-blocker policy without changing the default Action behavior.

The machine-readable catalog is
[`readiness-profiles.json`](readiness-profiles.json), with a
[JSON Schema](../schema/readiness-profiles.schema.json).

## Profiles

| Profile | Minimum | Tool effects | Approval | Blockers |
| --- | ---: | --- | --- | --- |
| `read-only` | 12/20 | `read_only` | None required | Allowed |
| `draft-only` | 14/20 | `read_only`, `draft` | External effects prohibited | Fail |
| `state-changing` | 17/20 | All declared effects | Every `external_state` tool | Fail |

Each profile also requires the capability implied by its name: at least one
`read_only`, `draft`, or `external_state` tool respectively. This prevents a
high-scoring card from selecting a less accurate profile.

### Read-only

Use for Agents that can retrieve data but cannot write a draft, send a
message, mutate a repository, or change external state.

The lower total threshold reflects limited direct impact, but goal clarity and
tool permissions must both score 2. Evals, failure handling, security, and
observability must score at least 1. Launch blockers remain visible but do not
automatically fail this profile because no state-changing capability exists.

Tradeoff: read access can still expose private data or amplify untrusted
content. This profile is not a low-security exemption.

Example: [`read-only-agent.card.json`](../examples/read-only-agent.card.json).

### Draft-only

Use for Agents that may write into an isolated draft workspace but cannot
publish, send, merge, deploy, delete, purchase, or otherwise modify external
state.

Human review must score 2, and launch blockers fail the gate. The profile
disallows every `external_state` tool even when that tool declares approval.
This keeps “draft-only” a capability boundary, not a promise that the Agent
will voluntarily stop.

Tradeoff: a draft can still contain unsafe, private, or unsupported content.
The reviewer and destination adapter remain part of the security boundary.

Example: [`support-agent.card.json`](../examples/support-agent.card.json).
The example intentionally retains its 12/20 score and two blockers, so it
currently fails this profile.

### State-changing

Use when any tool can change an external system. Every such tool must declare
`effect: external_state` and `approval_required: true`.

The profile requires 17/20, scores of 2 for tool permissions, evals, failure
handling, security, observability, and human review, and no launch blockers.
These requirements reflect the need to prevent, detect, approve, and recover
from harmful actions.

Tradeoff: metadata cannot prove that the execution layer actually enforces
approval, authorization scope, idempotency, or rollback. Those controls still
need runtime evidence.

Example:
[`operations-agent.card.json`](../examples/operations-agent.card.json). The
example intentionally retains its 15/20 score and three blockers, so it
currently fails this profile.

## Tool Effects

Each profiled Agent Card tool needs an `effect`:

- `read_only`: reads data without creating persistent state.
- `draft`: writes only to an isolated, non-published workspace.
- `external_state`: changes a repository, service, account, message channel,
  payment system, production environment, or other external system.

Classify by capability, not expected usage. A tool that *can* publish is
`external_state` even when the prompt asks only for a draft.

## Action Usage

```yaml
- uses: lindixu6-hash/awesome-agentic-engineering@v0
  with:
    card: agent-card.json
    profile: "state-changing"
```

Selecting a profile is opt-in. Without `profile`, `min-score`,
`fail-below`, and `fail-on-blockers` retain their existing behavior. With a
profile, its minimum total replaces `min-score`, its blocker policy can enable
strict blocker failure, and profile requirements always fail closed.

Unknown profiles, malformed profile definitions, missing tool metadata,
disallowed effects, and missing external-state approvals fail the Action. The
Action outputs `profile` and `profile-passed` alongside the existing outputs.
