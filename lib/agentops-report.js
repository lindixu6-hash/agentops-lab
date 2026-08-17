const FIELD_ALIASES = {
  task_id: ["task_id", "id", "trace_id", "run_id", "任务id", "任务编号"],
  success: ["success", "succeeded", "passed", "status", "成功", "是否成功"],
  latency_ms: [
    "latency_ms",
    "duration_ms",
    "elapsed_ms",
    "latency",
    "延迟",
    "耗时毫秒"
  ],
  cost_usd: ["cost_usd", "cost", "total_cost", "成本", "成本美元"],
  human_review: [
    "human_review",
    "human_handoff",
    "escalated",
    "人工审核",
    "人工接管"
  ],
  error_type: [
    "error_type",
    "error_category",
    "failure_type",
    "错误类型",
    "失败类型"
  ],
  prompt_version: [
    "prompt_version",
    "agent_version",
    "version",
    "提示词版本",
    "版本"
  ],
  user_rating: ["user_rating", "rating", "score", "用户评分", "满意度"]
};

const TRUE_VALUES = new Set(["true", "1", "yes", "y", "success", "passed", "成功"]);
const FALSE_VALUES = new Set([
  "false",
  "0",
  "no",
  "n",
  "failed",
  "failure",
  "error",
  "失败"
]);

function normalizeKey(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_");
}

function valueFor(record, field) {
  const normalized = Object.fromEntries(
    Object.entries(record).map(([key, value]) => [normalizeKey(key), value])
  );
  const alias = FIELD_ALIASES[field].find((key) =>
    Object.hasOwn(normalized, normalizeKey(key))
  );
  return alias === undefined ? undefined : normalized[normalizeKey(alias)];
}

function parseBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (TRUE_VALUES.has(normalized)) return true;
  if (FALSE_VALUES.has(normalized)) return false;
  return fallback;
}

function parseNumber(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(String(value).replace(/[,$]/g, "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCsv(text) {
  const delimiter = text.includes("\t") && !text.includes(",") ? "\t" : ",";
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }

  const nonEmptyRows = rows.filter((item) =>
    item.some((cell) => String(cell).trim() !== "")
  );
  if (nonEmptyRows.length < 2) {
    throw new Error("CSV must include a header and at least one data row.");
  }

  const headers = nonEmptyRows[0].map((header) => header.trim());
  if (headers.some((header) => !header)) {
    throw new Error("CSV contains an empty header.");
  }

  return nonEmptyRows.slice(1).map((cells) =>
    Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]))
  );
}

export function parseInput(text, fileName = "") {
  const trimmed = String(text ?? "").replace(/^\uFEFF/, "").trim();
  if (!trimmed) throw new Error("The selected file is empty.");

  if (fileName.toLowerCase().endsWith(".json") || /^[\[{]/.test(trimmed)) {
    const parsed = JSON.parse(trimmed);
    const records = Array.isArray(parsed) ? parsed : parsed.records;
    if (!Array.isArray(records)) {
      throw new Error("JSON must be an array or an object with a records array.");
    }
    return records;
  }

  return parseCsv(trimmed);
}

export function normalizeRecords(rawRecords) {
  if (!Array.isArray(rawRecords)) {
    throw new TypeError("Records must be an array.");
  }

  const records = [];
  let invalidRows = 0;

  rawRecords.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record)) {
      invalidRows += 1;
      return;
    }

    const rawSuccess = valueFor(record, "success");
    if (rawSuccess === undefined || rawSuccess === "") {
      invalidRows += 1;
      return;
    }

    const success = parseBoolean(rawSuccess, false);
    const rawError = String(valueFor(record, "error_type") ?? "").trim();
    records.push({
      task_id: String(valueFor(record, "task_id") ?? `row-${index + 1}`),
      success,
      latency_ms: parseNumber(valueFor(record, "latency_ms")),
      cost_usd: parseNumber(valueFor(record, "cost_usd")),
      human_review: parseBoolean(valueFor(record, "human_review"), false),
      error_type: success ? "" : rawError || "unclassified",
      prompt_version: String(valueFor(record, "prompt_version") ?? "unknown").trim(),
      user_rating: parseNumber(valueFor(record, "user_rating"))
    });
  });

  if (records.length === 0) {
    throw new Error("No valid records found. A success or status field is required.");
  }

  return { records, invalidRows };
}

function average(values) {
  const valid = values.filter(Number.isFinite);
  if (valid.length === 0) return null;
  return valid.reduce((sum, value) => sum + value, 0) / valid.length;
}

function percentile(values, percentileValue) {
  const valid = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (valid.length === 0) return null;
  const index = Math.max(0, Math.ceil((percentileValue / 100) * valid.length) - 1);
  return valid[index];
}

function ratio(count, total) {
  return total === 0 ? 0 : count / total;
}

function round(value, digits = 2) {
  if (value === null) return null;
  const multiplier = 10 ** digits;
  return Math.round(value * multiplier) / multiplier;
}

function groupStats(records, key) {
  const groups = new Map();
  records.forEach((record) => {
    const name = record[key] || "unknown";
    const group = groups.get(name) || [];
    group.push(record);
    groups.set(name, group);
  });

  return Array.from(groups, ([name, items]) => {
    const successCount = items.filter((item) => item.success).length;
    return {
      name,
      total: items.length,
      success_rate: round(ratio(successCount, items.length) * 100, 1),
      average_latency_ms: round(average(items.map((item) => item.latency_ms)), 0),
      average_cost_usd: round(average(items.map((item) => item.cost_usd)), 4),
      human_review_rate: round(
        ratio(items.filter((item) => item.human_review).length, items.length) * 100,
        1
      )
    };
  }).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

function buildRecommendations(metrics) {
  const recommendations = [];
  const add = (priority, title, evidence, action) => {
    recommendations.push({ priority, title, evidence, action });
  };

  if (metrics.total < 20) {
    add(
      "P1",
      "扩大评测样本",
      `当前仅导入 ${metrics.total} 条有效记录。`,
      "至少收集 20 条代表性运行后再做发布决策。"
    );
  }

  if (metrics.success_rate < 80) {
    const topError = metrics.error_types[0];
    add(
      "P0",
      "修复主要失败模式",
      `成功率为 ${metrics.success_rate}%${
        topError ? `；${topError.name} 出现 ${topError.count} 次` : ""
      }。`,
      "把最高频失败转为回归用例，修复后重放再放量。"
    );
  }

  if (metrics.human_review_rate > 25) {
    add(
      "P1",
      "减少非必要人工接管",
      `人工接管率为 ${metrics.human_review_rate}%。`,
      "区分必要风险审批与可自动恢复的工具、指令失败。"
    );
  }

  if (metrics.p95_latency_ms !== null && metrics.p95_latency_ms > 8000) {
    add(
      "P1",
      "缩短慢路径",
      `P95 延迟为 ${metrics.p95_latency_ms} ms。`,
      "检查串行工具调用、模型路由、重试循环和早停条件。"
    );
  }

  const successfulCosts = metrics._successful_costs;
  const failedCosts = metrics._failed_costs;
  if (
    successfulCosts !== null &&
    failedCosts !== null &&
    failedCosts > successfulCosts
  ) {
    add(
      "P1",
      "限制失败任务成本",
      `失败任务平均成本为 $${failedCosts.toFixed(4)}，成功任务为 $${successfulCosts.toFixed(
        4
      )}。`,
      "增加单任务调用预算，终止重复工具或推理循环。"
    );
  }

  if (metrics.versions.length >= 2) {
    const byOrder = [...metrics.versions];
    const best = byOrder.reduce((current, item) =>
      item.success_rate > current.success_rate ? item : current
    );
    const worst = byOrder.reduce((current, item) =>
      item.success_rate < current.success_rate ? item : current
    );
    if (best.success_rate - worst.success_rate >= 5) {
      add(
        "P0",
        "复现版本回归",
        `${best.name} 成功率为 ${best.success_rate}%，${worst.name} 为 ${worst.success_rate}%。`,
        "使用同一回归集重放两个版本，再决定放量或回滚。"
      );
    }
  }

  if (recommendations.length === 0) {
    add(
      "P2",
      "扩展对抗评测",
      "核心运营指标处于 MVP 阈值内。",
      "增加歧义任务、提示注入、工具失败和长任务用例。"
    );
  }

  return recommendations.sort((a, b) => a.priority.localeCompare(b.priority));
}

export function analyzeRecords(records, invalidRows = 0) {
  const total = records.length;
  const successes = records.filter((record) => record.success);
  const failures = records.filter((record) => !record.success);
  const errorCounts = new Map();
  failures.forEach((record) => {
    errorCounts.set(record.error_type, (errorCounts.get(record.error_type) || 0) + 1);
  });

  const metrics = {
    total,
    invalid_rows: invalidRows,
    success_count: successes.length,
    failure_count: failures.length,
    success_rate: round(ratio(successes.length, total) * 100, 1),
    human_review_rate: round(
      ratio(records.filter((record) => record.human_review).length, total) * 100,
      1
    ),
    average_latency_ms: round(average(records.map((record) => record.latency_ms)), 0),
    p95_latency_ms: round(
      percentile(records.map((record) => record.latency_ms), 95),
      0
    ),
    total_cost_usd: round(
      records
        .map((record) => record.cost_usd)
        .filter(Number.isFinite)
        .reduce((sum, value) => sum + value, 0),
      4
    ),
    average_cost_usd: round(average(records.map((record) => record.cost_usd)), 4),
    average_user_rating: round(
      average(records.map((record) => record.user_rating)),
      2
    ),
    error_types: Array.from(errorCounts, ([name, count]) => ({
      name,
      count,
      share_of_failures: round(ratio(count, failures.length) * 100, 1)
    })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name)),
    versions: groupStats(records, "prompt_version"),
    _successful_costs: average(successes.map((record) => record.cost_usd)),
    _failed_costs: average(failures.map((record) => record.cost_usd))
  };

  metrics.recommendations = buildRecommendations(metrics);
  delete metrics._successful_costs;
  delete metrics._failed_costs;
  return metrics;
}

function display(value, suffix = "") {
  return value === null ? "n/a" : `${value}${suffix}`;
}

export function buildMarkdownReport(metrics, options = {}) {
  const source = options.source || "local import";
  const generatedAt = options.generatedAt || new Date().toISOString();
  const errors = metrics.error_types.length
    ? metrics.error_types
        .map(
          (item) =>
            `| ${item.name} | ${item.count} | ${item.share_of_failures}% |`
        )
        .join("\n")
    : "| none | 0 | 0% |";
  const versions = metrics.versions
    .map(
      (item) =>
        `| ${item.name} | ${item.total} | ${item.success_rate}% | ${display(
          item.average_latency_ms,
          " ms"
        )} | ${display(item.average_cost_usd, " USD")} |`
    )
    .join("\n");
  const recommendations = metrics.recommendations
    .map(
      (item) =>
        `### ${item.priority}: ${item.title}\n\n- Evidence: ${item.evidence}\n- Action: ${item.action}`
    )
    .join("\n\n");

  return `# AgentOps Evaluation Report

> Generated locally at ${generatedAt}  
> Source: ${source}  
> Valid records: ${metrics.total}; invalid rows skipped: ${metrics.invalid_rows}

## Executive Summary

| Metric | Value |
| --- | ---: |
| Task success rate | ${metrics.success_rate}% |
| Successful / failed runs | ${metrics.success_count} / ${metrics.failure_count} |
| Human review rate | ${metrics.human_review_rate}% |
| Average latency | ${display(metrics.average_latency_ms, " ms")} |
| P95 latency | ${display(metrics.p95_latency_ms, " ms")} |
| Total cost | ${display(metrics.total_cost_usd, " USD")} |
| Average cost / run | ${display(metrics.average_cost_usd, " USD")} |
| Average user rating | ${display(metrics.average_user_rating, " / 5")} |

## Failure Distribution

| Error type | Count | Share of failures |
| --- | ---: | ---: |
${errors}

## Version Comparison

| Version | Runs | Success rate | Avg latency | Avg cost |
| --- | ---: | ---: | ---: | ---: |
${versions}

## Recommended Actions

${recommendations}

## Interpretation Boundary

This report describes the imported sample only. It does not prove production safety, causal impact, or statistical significance. Review raw cases before shipping or rolling back a version.
`;
}

export function evaluateInput(text, fileName = "") {
  const rawRecords = parseInput(text, fileName);
  const normalized = normalizeRecords(rawRecords);
  const metrics = analyzeRecords(normalized.records, normalized.invalidRows);
  return { ...normalized, metrics };
}
