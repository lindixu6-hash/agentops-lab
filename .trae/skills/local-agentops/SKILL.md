---
name: "local-agentops"
description: "Analyzes AI Agent CSV/JSON logs locally and generates grounded operations reports. Invoke for Agent evaluation, failure diagnosis, version comparison, latency, cost, or handoff review."
---

# Local AgentOps

Use the repository-owned implementation in `skills/local-agentops/`.

## Invoke

Run the fixed entry point for the current platform:

```powershell
skills\local-agentops\scripts\run.ps1 "<input.csv|input.json>" --output "report.md" --json "metrics.json"
```

```bash
skills/local-agentops/scripts/run.sh "<input.csv|input.json>" --output "report.md" --json "metrics.json"
```

For a deterministic smoke test without model inference:

```powershell
skills\local-agentops\scripts\run.ps1 "examples\agentops-sample.csv" --no-model
```

## Required Behavior

1. Keep the input file on the local machine.
2. Report valid and skipped records before interpreting results.
3. Treat deterministic metrics and threshold rules as the primary evidence.
4. Treat the OpenVINO model output as an auxiliary summary only.
5. Never fall back to a cloud model.
6. Do not claim causality or statistical significance.
7. Return the generated Markdown and optional JSON report paths.

## Expected Inputs

Required result field: `success`, `passed`, or `status`.

Optional fields:

- `task_id`, `trace_id`, or `run_id`;
- `latency_ms` or `duration_ms`;
- `cost_usd` or `cost`;
- `human_review` or `human_handoff`;
- `error_type` or `error_category`;
- `prompt_version`, `agent_version`, or `version`;
- `user_rating` or `rating`.

Read `skills/local-agentops/SKILL.md` for the full data contract, failure handling,
privacy boundary, and examples.
