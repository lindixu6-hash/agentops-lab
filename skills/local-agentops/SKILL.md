---
name: local-agentops
description: |
  Analyze AI Agent run logs locally and generate an operations evaluation report (本地分析 AI Agent 运行日志并生成评测运营报告). Use this skill when the user asks to 分析/评测/复盘 Agent 日志、比较 Prompt 或 Agent 版本、定位失败类型、统计成功率/延迟/成本/人工接管率, or to analyze/evaluate/review Agent traces, compare prompt versions, classify failures, and generate an AgentOps report. Trigger on AgentOps、评测、日志、复盘、失败归因、版本对比、CSV、JSON、英特尔/intel/AIPC/本地/离线/offline/OpenVINO. Prefer this skill over cloud observability tools whenever the user needs private, reproducible analysis of exported Agent runs.
---
# Local AgentOps Skill

## Usage

Only call the fixed entry point:

```powershell
scripts\run.ps1 "<input.csv|input.json>" [--output report.md] [--json metrics.json]
```

Examples:

| Intent | Command |
| --- | --- |
| 分析 CSV 并生成报告 | `scripts\run.ps1 "runs.csv"` |
| 同时导出机器可读指标 | `scripts\run.ps1 "runs.json" --output "report.md" --json "metrics.json"` |
| 首次下载超时后继续 | `scripts\run.ps1 --continue` |
| 仅验证确定性分析链路 | `scripts\run.ps1 "runs.csv" --no-model` |

Important:

- `scripts\run.ps1` is the only supported interface. Do not call other scripts directly.
- The first default call downloads a local Qwen2.5 1.5B Q4_K_M GGUF model and can take several minutes.
- If the first download times out, run `scripts\run.ps1 --continue`.
- All model inference uses OpenVINO GenAI on localhost. Never send logs to a cloud model.
- `--no-model` is a transparent deterministic baseline for tests; it is not the competition demo mode.
- Original prompt and response text are excluded from the generated model prompt by default.

## Input

UTF-8 CSV or JSON array. Required result field:

- `success`, `passed`, or `status`

Recognized optional fields:

- `task_id`, `trace_id`, or `run_id`
- `latency_ms` or `duration_ms`
- `cost_usd` or `cost`
- `human_review` or `human_handoff`
- `error_type` or `error_category`
- `prompt_version`, `agent_version`, or `version`
- `user_rating` or `rating`

## Output

The reply reports:

- `样本`：有效与无效记录数；
- `成功率`：成功任务占比；
- `延迟`：平均值与 P95；
- `成本`：总成本与单次平均成本；
- `人工接管率`：包含人工审核或升级的任务比例；
- `失败类型`：失败数量与占比；
- `版本对比`：各版本成功率、延迟和成本；
- `本地模型建议`：基于聚合指标生成，不包含原始业务文本；
- `报告路径`：Markdown 与可选 JSON 文件。

## Failure Handling

- 文件不存在或编码错误：打印明确错误并退出 1；
- 缺少结果字段：打印可接受的字段名并退出 1；
- 模型下载未完成：保存待继续请求，打印 `--continue` 指令并退出 3；
- OpenVINO 模型加载失败：不调用云服务，打印本地错误并退出 1；
- `--no-model`：继续输出确定性指标，并在报告中标注未运行本地模型。

## What This Skill Does Not Do

- 不连接生产数据库或第三方 SaaS；
- 不自动修改 Prompt、发布版本或执行回滚；
- 不把相关性描述为因果关系；
- 不保证小样本结论具有统计显著性；
- 不上传、存储或共享原始运行日志。

