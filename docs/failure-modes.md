# AI Agent Failure Modes

For public, source-linked examples and regression tests, see
[Production Incidents and Regression Tests](production-incidents.md).

Use these as starter cases for evals, incident reviews, and launch checklists.

## 1. Silent Failure

The agent returns a confident answer while skipping a required step.

Signals:

- Final answer cites no evidence
- Required tool calls are missing
- Logs show early termination
- Users report plausible but wrong results

Prevention:

- Define "done means"
- Require evidence for claims
- Check mandatory tool calls
- Add regression evals for skipped steps

## 2. Tool Abuse

The agent calls expensive, slow, or risky tools too often.

Signals:

- Cost spikes
- Repeated calls with similar inputs
- Rate-limit errors
- User tasks stall without progress

Prevention:

- Per-task tool budgets
- Rate limits
- Dry-run mode
- Tool-call deduplication
- Human approval for write actions

## 3. Memory Drift

The agent accumulates stale, wrong, or overly broad assumptions.

Signals:

- Agent references outdated decisions
- User preferences leak across projects
- Incorrect summaries affect future tasks
- Memory cannot be traced to a source

Prevention:

- Scoped memory
- Expiring summaries
- User-confirmed facts
- Memory inspection and deletion

## 4. Prompt Injection

Untrusted content tells the agent to ignore rules, reveal secrets, or perform unsafe actions.

Signals:

- External documents contain instruction-like text
- Agent follows instructions from retrieved content
- Tool calls happen without user intent
- Sensitive data appears in output

Prevention:

- Treat external content as data
- Separate instructions from retrieved material
- Add adversarial fixtures
- Require approval for external writes

## 5. Cost Explosion

The agent loops, over-searches, or uses expensive models for low-value steps.

Signals:

- Task cost exceeds expected range
- Repeated planning without execution
- Long traces with little state change
- Model routing ignores task difficulty

Prevention:

- Cost budget per task
- Max iterations
- Early-stop criteria
- Cheap model routing for low-risk steps

## 6. Over-Autonomy

The agent gets permission to act before the product can absorb mistakes.

Signals:

- Users cannot preview actions
- No rollback path
- Write tools lack approval boundaries
- Incidents require manual database repair

Prevention:

- Preview before action
- Approval tiers
- Reversible operations
- Read-only beta before write access

## 7. Context Contamination

The agent mixes unrelated users, projects, tickets, or repositories.

Signals:

- Wrong customer details in drafts
- Cross-project assumptions
- Retrieved documents from the wrong workspace
- Confusing audit trails

Prevention:

- Strong tenant and project boundaries
- Source-linked retrieval
- Context reset controls
- Access checks before retrieval

## 8. Evaluation Theater

The project has evals, but they do not catch real failures.

Signals:

- Evals only test happy paths
- No malicious or ambiguous scenarios
- Human reviewers keep finding obvious misses
- Model changes pass evals but regress in production

Prevention:

- Add incident-derived evals
- Include adversarial and missing-data cases
- Track false pass and false fail rates
- Review eval coverage before launch
