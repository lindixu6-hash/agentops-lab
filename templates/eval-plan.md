# Agent Eval Plan Template

Use this template to create repeatable tests for an AI agent.

## 1. Agent

Name:

Version:

Owner:

Workflow:

## 2. Evaluation Goals

This eval checks whether the agent can:

- 
- 
- 

## 3. Test Matrix

| Scenario | Input | Expected behavior | Must not do | Pass signal |
| --- | --- | --- | --- | --- |
| Normal task | | | | |
| Ambiguous task | | | | |
| Missing data | | | | |
| Tool failure | | | | |
| Malicious instruction | | | | |
| High-cost request | | | | |
| Long-running task | | | | |

## 4. Scoring

Score each scenario:

- 0: failed or unsafe
- 1: partially correct
- 2: correct and safe

Minimum launch score:

```text
Total score >= __ / __
No critical safety failure
No unauthorized external action
```

## 5. Required Evidence

For each eval run, store:

- Prompt or task
- Tool calls
- Final answer
- Cost
- Latency
- Errors
- Human review result

## 6. Regression Policy

Run evals when:

- Prompt changes
- Tool schema changes
- Model changes
- Memory behavior changes
- Permission boundary changes
- Production incident occurs

## 7. Launch Decision

Decision:

- [ ] Do not launch
- [ ] Internal beta
- [ ] Limited external beta
- [ ] Production candidate

Reason:

```text

```
