import {
  buildMarkdownReport,
  evaluateInput
} from "../lib/agentops-report.js";

let currentMetrics = null;
let currentSource = "";

const workspace = document.querySelector("#workspace");
const fileInput = document.querySelector("#file-input");
const sampleButton = document.querySelector("#sample-button");
const status = document.querySelector("#import-status");
const metricGrid = document.querySelector("#metric-grid");
const metricTemplate = document.querySelector("#metric-template");
const failureList = document.querySelector("#failure-list");
const versionBody = document.querySelector("#version-body");
const recommendationList = document.querySelector("#recommendation-list");

function formatNumber(value, suffix = "") {
  return value === null ? "n/a" : `${value}${suffix}`;
}

function metric(label, value, note) {
  const node = metricTemplate.content.firstElementChild.cloneNode(true);
  node.querySelector("span").textContent = label;
  node.querySelector("strong").textContent = value;
  node.querySelector("small").textContent = note;
  return node;
}

function renderMetrics(metrics) {
  metricGrid.replaceChildren(
    metric("任务成功率", `${metrics.success_rate}%`, "主要发布判断"),
    metric(
      "P95 延迟",
      formatNumber(metrics.p95_latency_ms, " ms"),
      "最慢 5% 边界"
    ),
    metric(
      "人工接管率",
      `${metrics.human_review_rate}%`,
      "含必要审批与异常接管"
    ),
    metric(
      "平均成本",
      metrics.average_cost_usd === null
        ? "n/a"
        : `$${metrics.average_cost_usd.toFixed(4)}`,
      "每次运行"
    ),
    metric(
      "用户评分",
      formatNumber(metrics.average_user_rating, " / 5"),
      "有效评分平均值"
    )
  );
}

function renderFailures(metrics) {
  failureList.replaceChildren();
  if (metrics.error_types.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-state";
    empty.textContent = "当前样本没有失败记录。";
    failureList.append(empty);
    return;
  }

  const maxCount = Math.max(...metrics.error_types.map((item) => item.count));
  metrics.error_types.forEach((item) => {
    const row = document.createElement("div");
    row.className = "bar-row";

    const heading = document.createElement("div");
    const name = document.createElement("strong");
    name.textContent = item.name;
    const value = document.createElement("span");
    value.textContent = `${item.count} 次 · ${item.share_of_failures}%`;
    heading.append(name, value);

    const track = document.createElement("div");
    track.className = "bar-track";
    const bar = document.createElement("span");
    bar.style.width = `${(item.count / maxCount) * 100}%`;
    track.append(bar);

    row.append(heading, track);
    failureList.append(row);
  });
}

function renderVersions(metrics) {
  versionBody.replaceChildren();
  metrics.versions.forEach((version) => {
    const row = document.createElement("tr");
    [
      version.name,
      String(version.total),
      `${version.success_rate}%`,
      formatNumber(version.average_latency_ms, " ms"),
      version.average_cost_usd === null
        ? "n/a"
        : `$${version.average_cost_usd.toFixed(4)}`
    ].forEach((value) => {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    });
    versionBody.append(row);
  });
}

function renderRecommendations(metrics) {
  recommendationList.replaceChildren();
  metrics.recommendations.forEach((recommendation) => {
    const item = document.createElement("li");

    const priority = document.createElement("span");
    priority.className = `priority ${recommendation.priority.toLowerCase()}`;
    priority.textContent = recommendation.priority;

    const copy = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = recommendation.title;
    const evidence = document.createElement("p");
    evidence.textContent = recommendation.evidence;
    const action = document.createElement("p");
    action.className = "action";
    action.textContent = recommendation.action;
    copy.append(title, evidence, action);

    item.append(priority, copy);
    recommendationList.append(item);
  });
}

function render(result, source) {
  currentMetrics = result.metrics;
  currentSource = source;
  document.querySelector("#sample-size").textContent = `${result.metrics.total} 条有效记录`;
  renderMetrics(result.metrics);
  renderFailures(result.metrics);
  renderVersions(result.metrics);
  renderRecommendations(result.metrics);
  workspace.hidden = false;
  status.className = "status success";
  status.textContent = `已在本地分析 ${result.metrics.total} 条记录；跳过 ${result.metrics.invalid_rows} 条无效记录。`;
  workspace.scrollIntoView({ behavior: "smooth", block: "start" });
}

function analyze(text, source) {
  try {
    render(evaluateInput(text, source), source);
  } catch (error) {
    currentMetrics = null;
    status.className = "status error";
    status.textContent = `无法分析：${error.message}`;
  }
}

async function loadFile(file) {
  if (!file) return;
  const text = await file.text();
  analyze(text, file.name);
}

async function loadSample() {
  status.className = "status";
  status.textContent = "正在加载合成示例...";
  try {
    const response = await fetch("../examples/agentops-sample.csv");
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    analyze(await response.text(), "agentops-sample.csv");
  } catch (error) {
    status.className = "status error";
    status.textContent = `示例加载失败：${error.message}`;
  }
}

function downloadFile(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

fileInput.addEventListener("change", async () => {
  await loadFile(fileInput.files?.[0]);
});

sampleButton.addEventListener("click", loadSample);

document.querySelector("#download-markdown").addEventListener("click", () => {
  if (!currentMetrics) return;
  downloadFile(
    "agentops-evaluation-report.md",
    buildMarkdownReport(currentMetrics, { source: currentSource }),
    "text/markdown;charset=utf-8"
  );
});

document.querySelector("#download-json").addEventListener("click", () => {
  if (!currentMetrics) return;
  downloadFile(
    "agentops-evaluation-metrics.json",
    `${JSON.stringify(currentMetrics, null, 2)}\n`,
    "application/json;charset=utf-8"
  );
});

if (new URLSearchParams(window.location.search).get("sample") === "1") {
  loadSample();
}
