"""Local AgentOps report generator with optional OpenVINO GenAI synthesis."""

from __future__ import annotations

import argparse
import csv
import json
import math
import statistics
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

SKILL_ROOT = Path(__file__).resolve().parents[1]
INFO_PATH = SKILL_ROOT / "info.json"
PENDING_PATH = SKILL_ROOT / ".agentops-pending.json"

TRUE_VALUES = {"true", "1", "yes", "y", "success", "passed", "成功"}
FIELD_ALIASES = {
    "task_id": ["task_id", "id", "trace_id", "run_id", "任务id", "任务编号"],
    "success": ["success", "succeeded", "passed", "status", "成功", "是否成功"],
    "latency_ms": ["latency_ms", "duration_ms", "elapsed_ms", "latency", "延迟"],
    "cost_usd": ["cost_usd", "cost", "total_cost", "成本", "成本美元"],
    "human_review": [
        "human_review",
        "human_handoff",
        "escalated",
        "人工审核",
        "人工接管",
    ],
    "error_type": [
        "error_type",
        "error_category",
        "failure_type",
        "错误类型",
        "失败类型",
    ],
    "prompt_version": [
        "prompt_version",
        "agent_version",
        "version",
        "提示词版本",
        "版本",
    ],
    "user_rating": ["user_rating", "rating", "score", "用户评分", "满意度"],
}


def configure_stream(stream: Any) -> None:
    reconfigure = getattr(stream, "reconfigure", None)
    if callable(reconfigure):
        reconfigure(encoding="utf-8")


configure_stream(sys.stdout)
configure_stream(sys.stderr)


def normalized_key(value: Any) -> str:
    return "_".join(str(value or "").strip().lower().split())


def field_value(record: dict[str, Any], name: str) -> Any:
    normalized = {normalized_key(key): value for key, value in record.items()}
    for alias in FIELD_ALIASES[name]:
        key = normalized_key(alias)
        if key in normalized:
            return normalized[key]
    return None


def as_bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in TRUE_VALUES


def as_number(value: Any) -> float | None:
    if value is None or str(value).strip() == "":
        return None
    try:
        return float(str(value).replace(",", "").replace("$", "").strip())
    except ValueError:
        return None


def load_records(path: Path) -> list[dict[str, Any]]:
    text = path.read_text(encoding="utf-8-sig")
    if path.suffix.lower() == ".json" or text.lstrip().startswith(("[", "{")):
        parsed = json.loads(text)
        records = parsed if isinstance(parsed, list) else parsed.get("records")
        if not isinstance(records, list):
            raise ValueError("JSON 必须是数组或包含 records 数组。")
        return records
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        return list(csv.DictReader(handle))


def normalize(records: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    valid: list[dict[str, Any]] = []
    invalid = 0
    for index, raw in enumerate(records, start=1):
        if not isinstance(raw, dict):
            invalid += 1
            continue
        result = field_value(raw, "success")
        if result is None or str(result).strip() == "":
            invalid += 1
            continue
        success = as_bool(result)
        error = str(field_value(raw, "error_type") or "").strip()
        valid.append(
            {
                "task_id": str(field_value(raw, "task_id") or f"row-{index}"),
                "success": success,
                "latency_ms": as_number(field_value(raw, "latency_ms")),
                "cost_usd": as_number(field_value(raw, "cost_usd")),
                "human_review": as_bool(field_value(raw, "human_review")),
                "error_type": "" if success else (error or "unclassified"),
                "prompt_version": str(
                    field_value(raw, "prompt_version") or "unknown"
                ).strip(),
                "user_rating": as_number(field_value(raw, "user_rating")),
            }
        )
    if not valid:
        raise ValueError("没有有效记录；至少需要 success、passed 或 status 字段。")
    return valid, invalid


def average(values: list[float | None]) -> float | None:
    valid = [value for value in values if value is not None]
    return statistics.fmean(valid) if valid else None


def percentile(values: list[float | None], percent: int) -> float | None:
    valid = sorted(value for value in values if value is not None)
    if not valid:
        return None
    index = max(0, math.ceil(percent / 100 * len(valid)) - 1)
    return valid[index]


def rounded(value: float | None, digits: int = 2) -> float | None:
    return None if value is None else round(value, digits)


def version_stats(records: list[dict[str, Any]]) -> list[dict[str, Any]]:
    groups: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for record in records:
        groups[record["prompt_version"]].append(record)
    output = []
    for name, items in groups.items():
        total = len(items)
        output.append(
            {
                "name": name,
                "total": total,
                "success_rate": round(
                    sum(item["success"] for item in items) / total * 100, 1
                ),
                "average_latency_ms": rounded(
                    average([item["latency_ms"] for item in items]), 0
                ),
                "average_cost_usd": rounded(
                    average([item["cost_usd"] for item in items]), 4
                ),
            }
        )
    return sorted(output, key=lambda item: (-item["total"], item["name"]))


def analyze(records: list[dict[str, Any]], invalid: int) -> dict[str, Any]:
    successes = [record for record in records if record["success"]]
    failures = [record for record in records if not record["success"]]
    errors = Counter(record["error_type"] for record in failures)
    total = len(records)
    metrics: dict[str, Any] = {
        "total": total,
        "invalid_rows": invalid,
        "success_count": len(successes),
        "failure_count": len(failures),
        "success_rate": round(len(successes) / total * 100, 1),
        "human_review_rate": round(
            sum(record["human_review"] for record in records) / total * 100, 1
        ),
        "average_latency_ms": rounded(
            average([record["latency_ms"] for record in records]), 0
        ),
        "p95_latency_ms": rounded(
            percentile([record["latency_ms"] for record in records], 95), 0
        ),
        "total_cost_usd": round(
            sum(record["cost_usd"] or 0 for record in records), 4
        ),
        "average_cost_usd": rounded(
            average([record["cost_usd"] for record in records]), 4
        ),
        "average_user_rating": rounded(
            average([record["user_rating"] for record in records]), 2
        ),
        "error_types": [
            {
                "name": name,
                "count": count,
                "share_of_failures": round(count / len(failures) * 100, 1),
            }
            for name, count in errors.most_common()
        ],
        "versions": version_stats(records),
    }
    metrics["recommendations"] = deterministic_recommendations(metrics)
    return metrics


def deterministic_recommendations(metrics: dict[str, Any]) -> list[dict[str, str]]:
    output: list[dict[str, str]] = []
    if metrics["total"] < 20:
        output.append(
            {
                "priority": "P1",
                "title": "扩大评测样本",
                "evidence": f"当前仅有 {metrics['total']} 条有效记录。",
                "action": "至少收集 20 条代表性运行后再做发布决策。",
            }
        )
    if metrics["success_rate"] < 80:
        top = metrics["error_types"][0] if metrics["error_types"] else None
        evidence = f"成功率为 {metrics['success_rate']}%。"
        if top:
            evidence += f"最高频失败 {top['name']} 出现 {top['count']} 次。"
        output.append(
            {
                "priority": "P0",
                "title": "修复主要失败模式",
                "evidence": evidence,
                "action": "把最高频失败转为回归用例，修复后重放再放量。",
            }
        )
    if metrics["human_review_rate"] > 25:
        output.append(
            {
                "priority": "P1",
                "title": "减少非必要人工接管",
                "evidence": f"人工接管率为 {metrics['human_review_rate']}%。",
                "action": "区分必要审批与可自动恢复的工具、指令失败。",
            }
        )
    if metrics["p95_latency_ms"] and metrics["p95_latency_ms"] > 8000:
        output.append(
            {
                "priority": "P1",
                "title": "缩短慢路径",
                "evidence": f"P95 延迟为 {metrics['p95_latency_ms']} ms。",
                "action": "检查串行工具调用、重试循环、模型路由和早停条件。",
            }
        )
    if len(metrics["versions"]) >= 2:
        best = max(metrics["versions"], key=lambda item: item["success_rate"])
        worst = min(metrics["versions"], key=lambda item: item["success_rate"])
        if best["success_rate"] - worst["success_rate"] >= 5:
            output.append(
                {
                    "priority": "P0",
                    "title": "复现版本回归",
                    "evidence": (
                        f"{best['name']} 成功率 {best['success_rate']}%，"
                        f"{worst['name']} 为 {worst['success_rate']}%。"
                    ),
                    "action": "使用同一回归集重放两个版本，再决定放量或回滚。",
                }
            )
    return output or [
        {
            "priority": "P2",
            "title": "扩展对抗评测",
            "evidence": "核心运营指标处于 MVP 阈值内。",
            "action": "增加歧义任务、提示注入、工具失败和长任务用例。",
        }
    ]


def find_or_download_model(continue_download: bool) -> Path:
    info = json.loads(INFO_PATH.read_text(encoding="utf-8"))
    config = info["models"][0]
    model_root = SKILL_ROOT / "models" / config["dir_name"]
    filename = config["required_files"][0]
    candidate = model_root / filename
    if candidate.exists():
        return candidate

    try:
        from modelscope import snapshot_download
    except ImportError as exc:
        raise RuntimeError("缺少 modelscope；请先运行环境安装。") from exc

    print("正在本地下载 Qwen2.5 1.5B Q4_K_M 模型，可用 --continue 续传。")
    downloaded = Path(
        snapshot_download(
            config["model_id"],
            local_dir=str(model_root),
            allow_file_pattern=[filename],
        )
    )
    candidate = downloaded / filename
    if not candidate.exists():
        candidates = list(downloaded.rglob(filename))
        if not candidates:
            raise RuntimeError(f"模型下载完成但未找到必需文件：{filename}")
        candidate = candidates[0]
    if continue_download:
        PENDING_PATH.unlink(missing_ok=True)
    return candidate


def local_model_summary(metrics: dict[str, Any], model_path: Path, device: str) -> str:
    try:
        import openvino_genai as ov_genai
    except ImportError as exc:
        raise RuntimeError("缺少 openvino-genai；请先运行环境安装。") from exc

    aggregate = {
        "total": metrics["total"],
        "success_rate": metrics["success_rate"],
        "human_review_rate": metrics["human_review_rate"],
        "p95_latency_ms": metrics["p95_latency_ms"],
        "average_cost_usd": metrics["average_cost_usd"],
        "error_types": metrics["error_types"],
        "versions": metrics["versions"],
    }
    prompt = (
        "你是 AI Agent 产品运营分析师。只根据以下聚合指标，用中文给出三条"
        "可验证、带优先级的迭代建议。不要编造因果、用户反馈或原始日志内容。"
        "每条格式：P0/P1/P2｜问题｜证据｜下一步。\n"
        + json.dumps(aggregate, ensure_ascii=False)
    )
    pipeline = ov_genai.LLMPipeline(str(model_path), device)
    return str(
        pipeline.generate(
            prompt,
            max_new_tokens=280,
            temperature=0.2,
            top_p=0.9,
        )
    ).strip()


def display(value: Any, suffix: str = "") -> str:
    return "n/a" if value is None else f"{value}{suffix}"


def markdown(metrics: dict[str, Any], source: str, model_output: str) -> str:
    errors = "\n".join(
        f"| {item['name']} | {item['count']} | {item['share_of_failures']}% |"
        for item in metrics["error_types"]
    ) or "| none | 0 | 0% |"
    versions = "\n".join(
        (
            f"| {item['name']} | {item['total']} | {item['success_rate']}% | "
            f"{display(item['average_latency_ms'], ' ms')} | "
            f"{display(item['average_cost_usd'], ' USD')} |"
        )
        for item in metrics["versions"]
    )
    deterministic = "\n".join(
        (
            f"### {item['priority']}：{item['title']}\n\n"
            f"- 证据：{item['evidence']}\n"
            f"- 下一步：{item['action']}\n"
        )
        for item in metrics["recommendations"]
    )
    return f"""# AgentOps 本地评测报告

> 数据源：{source}  
> 有效记录：{metrics['total']}；跳过无效记录：{metrics['invalid_rows']}  
> 隐私：原始文件仅在本机处理；模型只接收聚合指标

## 核心指标

| 指标 | 数值 |
| --- | ---: |
| 任务成功率 | {metrics['success_rate']}% |
| 成功 / 失败 | {metrics['success_count']} / {metrics['failure_count']} |
| 人工接管率 | {metrics['human_review_rate']}% |
| 平均延迟 | {display(metrics['average_latency_ms'], ' ms')} |
| P95 延迟 | {display(metrics['p95_latency_ms'], ' ms')} |
| 总成本 | {display(metrics['total_cost_usd'], ' USD')} |
| 单次平均成本 | {display(metrics['average_cost_usd'], ' USD')} |
| 用户平均评分 | {display(metrics['average_user_rating'], ' / 5')} |

## 失败类型

| 类型 | 数量 | 失败占比 |
| --- | ---: | ---: |
{errors}

## 版本对比

| 版本 | 样本 | 成功率 | 平均延迟 | 平均成本 |
| --- | ---: | ---: | ---: | ---: |
{versions}

## 确定性建议

{deterministic}

## 本地 OpenVINO 模型建议

{model_output}

## 结论边界

本报告只描述导入样本，不证明生产安全、因果关系或统计显著性。发布或回滚前必须人工复核原始失败案例。
"""


def parser() -> argparse.ArgumentParser:
    output = argparse.ArgumentParser(description="本地 AgentOps 日志评测")
    output.add_argument("input", nargs="?", help="CSV 或 JSON 文件")
    output.add_argument("--output", default="agentops-report.md")
    output.add_argument("--json", dest="json_output")
    output.add_argument("--model-path")
    output.add_argument("--device", default="CPU")
    output.add_argument("--no-model", action="store_true")
    output.add_argument("--continue", dest="continue_download", action="store_true")
    return output


def main(argv: list[str]) -> int:
    args = parser().parse_args(argv)
    if args.continue_download and not args.input and PENDING_PATH.exists():
        pending = json.loads(PENDING_PATH.read_text(encoding="utf-8"))
        args.input = pending["input"]
        args.output = pending["output"]
        args.json_output = pending.get("json_output")
    if not args.input:
        parser().print_help()
        return 1

    input_path = Path(args.input).expanduser().resolve()
    if not input_path.exists():
        print(f"错误：文件不存在：{input_path}", file=sys.stderr)
        return 1

    try:
        records, invalid = normalize(load_records(input_path))
        metrics = analyze(records, invalid)
        if args.no_model:
            model_output = "未运行本地模型：本次使用透明的确定性分析模式。"
        else:
            PENDING_PATH.write_text(
                json.dumps(
                    {
                        "input": str(input_path),
                        "output": args.output,
                        "json_output": args.json_output,
                    },
                    ensure_ascii=False,
                ),
                encoding="utf-8",
            )
            model_path = (
                Path(args.model_path).expanduser().resolve()
                if args.model_path
                else find_or_download_model(args.continue_download)
            )
            model_output = local_model_summary(metrics, model_path, args.device)
            PENDING_PATH.unlink(missing_ok=True)

        report_path = Path(args.output).expanduser().resolve()
        report_path.write_text(
            markdown(metrics, input_path.name, model_output), encoding="utf-8"
        )
        if args.json_output:
            Path(args.json_output).expanduser().resolve().write_text(
                json.dumps(metrics, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        print(
            f"样本：{metrics['total']}；成功率：{metrics['success_rate']}%；"
            f"失败：{metrics['failure_count']}；报告：{report_path}"
        )
        return 0
    except KeyboardInterrupt:
        print("模型下载或分析被中断，请运行 scripts\\run.ps1 --continue。")
        return 3
    except Exception as exc:
        print(f"错误：{exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))

