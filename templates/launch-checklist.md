# Agent Launch Checklist

Use this checklist before giving an AI agent to real users.

## Product

- [ ] The target user is clear.
- [ ] The primary workflow is narrow enough to evaluate.
- [ ] Success and failure are observable.
- [ ] The user can understand what the agent did.
- [ ] The user can recover from a bad result.

## Tools

- [ ] Every tool has a clear schema.
- [ ] Tools use least-privilege access.
- [ ] Write actions require approval or dry-run mode.
- [ ] Tool errors are visible to the agent and logs.
- [ ] Tool rate limits and budgets are defined.

## Memory

- [ ] Memory scope is documented.
- [ ] Users can inspect relevant memory.
- [ ] Users can delete or correct memory.
- [ ] Memory has retention rules.
- [ ] Sensitive data is not saved by default.

## Evals

- [ ] Normal path scenarios pass.
- [ ] Ambiguous tasks are handled safely.
- [ ] Missing data produces clarification or fallback.
- [ ] Tool failure does not create false confidence.
- [ ] Prompt injection tests pass.
- [ ] Cost-heavy requests are bounded.

## Security

- [ ] External content is treated as untrusted.
- [ ] System instructions are separated from retrieved data.
- [ ] Secrets are not exposed to model output.
- [ ] Public actions require human approval.
- [ ] Destructive actions require human approval.

## Operations

- [ ] Logs capture task, tool calls, errors, latency, and cost.
- [ ] There is an incident response owner.
- [ ] There is a rollback path.
- [ ] There are usage limits.
- [ ] There is a feedback channel.

## Launch Decision

- [ ] Demo only
- [ ] Internal beta
- [ ] Limited external beta
- [ ] Production candidate

Notes:

```text

```
