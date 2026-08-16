# Agent Card Template

Use this template before building or launching an AI agent.

## 1. Identity

Agent name:

Owner:

Users:

Primary workflow:

## 2. Job To Be Done

The agent helps users:

```text
When ...
I want ...
So that ...
```

## 3. Non-Goals

The agent must not:

- 
- 
- 

## 4. Success Metrics

Primary success metric:

Secondary metrics:

- 
- 
- 

Guardrail metrics:

- 
- 
- 

## 5. Inputs

Trusted inputs:

- 

Untrusted inputs:

- 

Sensitive inputs:

- 

## 6. Tools

| Tool | Purpose | Read/Write | Risk | Approval required |
| --- | --- | --- | --- | --- |
| | | | | |

## 7. Permissions

Allowed actions:

- 

Blocked actions:

- 

Requires human approval:

- 

## 8. Memory

Memory scope:

Memory retention:

User-visible memory:

Deletion path:

## 9. Failure Handling

Known failure modes:

- 

Fallback behavior:

- 

Escalation path:

- 

## 10. Evaluation

Must-pass evals:

- 

Regression evals:

- 

Adversarial evals:

- 

## 11. Launch Readiness

Before launch, confirm:

- [ ] Tool permissions are least-privilege.
- [ ] High-risk actions require approval.
- [ ] Logs include tool calls, errors, latency, and cost.
- [ ] Evals cover normal, ambiguous, and malicious scenarios.
- [ ] Users can understand what the agent did and why.
