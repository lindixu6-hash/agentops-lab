---
name: local-agentops
description: Analyze Agent CSV/JSON logs locally and generate grounded operations reports. Invoke for Agent evaluation, failure diagnosis, version comparison, latency, cost, or handoff review.
---
# Local AgentOps Skill

## Usage

Use the fixed entry point for the current platform:

```powershell
scripts\run.ps1 "<input.csv|input.json>" [--output report.md] [--json metrics.json]
```

```bash
scripts/run.sh "<input.csv|input.json>" [--output report.md] [--json metrics.json]
```

Examples:

| Intent | Command |
| --- | --- |
| 分析 CSV 并生成报告 | Windows: `scripts\run.ps1 "runs.csv"`; macOS/Linux: `scripts/run.sh "runs.csv"` |
| 同时导出机器可读指标 | Append `--output "report.md" --json "metrics.json"` |
| 首次下载超时后继续 | Append `--continue` |
| 仅验证确定性分析链路 | Append `--no-model` |

Important:

- `run.ps1` and `run.sh` are the supported platform wrappers. Both delegate to `run.py`; do not call `client.py` directly.
- The first default call downloads Qwen2.5 0.5B and exports it to native OpenVINO FP16 IR. Download and one-time export can take several minutes.
- If the first download times out, append `--continue` to the current platform wrapper.
- All model inference uses OpenVINO GenAI on localhost. Never send logs to a cloud model.
- Later calls reuse the exported IR under `models/Qwen2.5-0.5B-Instruct-OpenVINO-FP16/`.
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
- `本地模型辅助摘要`：模型排序后由代码原样渲染最多三条确定性建议，不包含原始业务文本；
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
