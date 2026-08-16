export const AREAS = [
  {
    id: "goal_clarity",
    en: "Goal clarity",
    zh: "目标清晰度",
    helpEn: "Task, user, and success metric",
    helpZh: "任务、用户与成功指标"
  },
  {
    id: "tool_permissions",
    en: "Tool permissions",
    zh: "工具权限",
    helpEn: "Least-privilege access boundaries",
    helpZh: "最小权限与访问边界"
  },
  {
    id: "memory",
    en: "Memory",
    zh: "记忆",
    helpEn: "Scoped, inspectable, erasable state",
    helpZh: "有范围、可检查、可删除"
  },
  {
    id: "evals",
    en: "Evals",
    zh: "评估",
    helpEn: "Repeatable scenario tests",
    helpZh: "可重复的场景测试"
  },
  {
    id: "failure_handling",
    en: "Failure handling",
    zh: "失败处理",
    helpEn: "Fallbacks and user recovery",
    helpZh: "降级与用户恢复路径"
  },
  {
    id: "security",
    en: "Security",
    zh: "安全",
    helpEn: "Prompt injection and data boundaries",
    helpZh: "提示注入与数据边界"
  },
  {
    id: "observability",
    en: "Observability",
    zh: "可观测性",
    helpEn: "Trace, cost, latency, and outcomes",
    helpZh: "轨迹、成本、延迟与结果"
  },
  {
    id: "cost_control",
    en: "Cost control",
    zh: "成本控制",
    helpEn: "Budgets, alerts, and limits",
    helpZh: "预算、告警与限制"
  },
  {
    id: "human_review",
    en: "Human review",
    zh: "人工审核",
    helpEn: "Approval for risky actions",
    helpZh: "高风险动作需要确认"
  },
  {
    id: "documentation",
    en: "Documentation",
    zh: "文档",
    helpEn: "Setup, architecture, and threat model",
    helpZh: "安装、架构与威胁模型"
  }
];

const COPY = {
  en: {
    title: "Production Readiness Scorecard",
    eyebrow: "20-point review",
    score: "Score",
    rating: "Rating",
    blockers: "Priority gaps",
    copy: "Copy JSON",
    download: "Download",
    share: "Share",
    resetTitle: "Reset scorecard",
    copied: "Agent Card JSON copied.",
    downloaded: "Agent Card JSON downloaded.",
    shared: "Share link copied.",
    copyFailed: "Clipboard unavailable. Download the JSON instead.",
    shareFailed: "Clipboard unavailable. Copy the URL from the address bar.",
    empty: "All areas scored at production-candidate level.",
    levels: ["Missing", "Partial", "Ready"],
    ratings: {
      "demo only": "demo only",
      prototype: "prototype",
      "limited beta": "limited beta",
      "production candidate": "production candidate"
    }
  },
  zh: {
    title: "Agent 生产就绪评分卡",
    eyebrow: "20 分检查",
    score: "得分",
    rating: "评级",
    blockers: "优先补齐",
    copy: "复制 JSON",
    download: "下载",
    share: "分享",
    resetTitle: "重置评分",
    copied: "已复制 Agent Card JSON。",
    downloaded: "已下载 Agent Card JSON。",
    shared: "评分链接已复制。",
    copyFailed: "剪贴板不可用，请改为下载 JSON。",
    shareFailed: "剪贴板不可用，请复制地址栏中的评分链接。",
    empty: "所有维度均达到生产候选标准。",
    levels: ["缺失", "部分", "就绪"],
    ratings: {
      "demo only": "仅 Demo",
      prototype: "原型",
      "limited beta": "有限 Beta",
      "production candidate": "生产候选"
    }
  }
};

export function ratingFor(total) {
  if (total <= 7) return "demo only";
  if (total <= 14) return "prototype";
  if (total <= 18) return "limited beta";
  return "production candidate";
}

export function calculateScore(scores) {
  const total = AREAS.reduce((sum, area) => {
    const value = Number(scores[area.id] ?? 0);
    return sum + Math.max(0, Math.min(2, value));
  }, 0);

  return {
    total,
    max: AREAS.length * 2,
    rating: ratingFor(total),
    gaps: AREAS
      .map((area) => ({ ...area, value: Number(scores[area.id] ?? 0) }))
      .filter((area) => area.value < 2)
      .sort((a, b) => a.value - b.value)
      .slice(0, 3)
  };
}

export function buildAgentCard(scores) {
  return {
    name: "My AI Agent",
    version: "0.1",
    scorecard: Object.fromEntries(
      AREAS.map((area) => [area.id, Number(scores[area.id] ?? 0)])
    )
  };
}

export function encodeScores(scores) {
  return AREAS.map((area) => Number(scores[area.id] ?? 0)).join("");
}

export function decodeScores(value) {
  if (!/^[0-2]{10}$/.test(value || "")) return null;
  return Object.fromEntries(
    AREAS.map((area, index) => [area.id, Number(value[index])])
  );
}

export function buildShareText(result, language = "en") {
  if (language === "zh") {
    return `我的 AI Agent 生产就绪评分是 ${result.total}/${result.max}（${COPY.zh.ratings[result.rating]}）。你的 Agent 能拿多少分？`;
  }
  return `My AI agent scored ${result.total}/${result.max} (${result.rating}) for production readiness. How ready is yours?`;
}

function createRow(area, scores, language, onChange) {
  const row = document.createElement("article");
  row.className = "score-row";

  const copy = document.createElement("div");
  copy.className = "area-copy";
  copy.innerHTML = `
    <strong>${area[language === "zh" ? "zh" : "en"]}</strong>
    <span>${area[language === "zh" ? "helpZh" : "helpEn"]}</span>
  `;

  const options = document.createElement("div");
  options.className = "score-options";
  options.setAttribute("role", "radiogroup");
  options.setAttribute("aria-label", area[language === "zh" ? "zh" : "en"]);

  COPY[language].levels.forEach((label, value) => {
    const option = document.createElement("label");
    option.innerHTML = `
      <input
        type="radio"
        name="${area.id}"
        value="${value}"
        ${scores[area.id] === value ? "checked" : ""}
      >
      <span>${value} · ${label}</span>
    `;
    option.querySelector("input").addEventListener("change", () => {
      scores[area.id] = value;
      onChange();
    });
    options.append(option);
  });

  row.append(copy, options);
  return row;
}

function bootstrap() {
  const params = new URLSearchParams(window.location.search);
  const sharedScores = decodeScores(params.get("scores"));
  const scores =
    sharedScores || Object.fromEntries(AREAS.map((area) => [area.id, 0]));
  let language = "en";

  const rows = document.querySelector("#scorecard-rows");
  const total = document.querySelector("#score-total");
  const rating = document.querySelector("#rating-value");
  const progress = document.querySelector("#progress-bar");
  const blockerList = document.querySelector("#blocker-list");
  const status = document.querySelector("#command-status");

  function render() {
    const result = calculateScore(scores);
    const copy = COPY[language];
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    document.querySelector("#page-title").textContent = copy.title;
    document.querySelector(".eyebrow").textContent = copy.eyebrow;
    document.querySelector("#score-label").textContent = copy.score;
    document.querySelector("#rating-label").textContent = copy.rating;
    document.querySelector("#blockers-title").textContent = copy.blockers;
    document.querySelector("#copy-button").textContent = copy.copy;
    document.querySelector("#download-button").textContent = copy.download;
    document.querySelector("#share-button").textContent = copy.share;
    document.querySelector("#reset-button").title = copy.resetTitle;
    document.querySelector("#language-toggle").textContent =
      language === "en" ? "中" : "EN";

    rows.replaceChildren(
      ...AREAS.map((area) => createRow(area, scores, language, render))
    );
    total.textContent = String(result.total);
    rating.textContent = copy.ratings[result.rating];
    progress.style.width = `${(result.total / result.max) * 100}%`;
    const url = new URL(window.location.href);
    url.searchParams.set("scores", encodeScores(scores));
    window.history.replaceState({}, "", url);

    blockerList.replaceChildren();
    if (result.gaps.length === 0) {
      const item = document.createElement("li");
      item.textContent = copy.empty;
      blockerList.append(item);
    } else {
      result.gaps.forEach((gap) => {
        const item = document.createElement("li");
        item.textContent = `${gap[language === "zh" ? "zh" : "en"]}: ${
          gap[language === "zh" ? "helpZh" : "helpEn"]
        }`;
        blockerList.append(item);
      });
    }
  }

  document.querySelector("#language-toggle").addEventListener("click", () => {
    language = language === "en" ? "zh" : "en";
    status.textContent = "";
    render();
  });

  document.querySelector("#reset-button").addEventListener("click", () => {
    AREAS.forEach((area) => {
      scores[area.id] = 0;
    });
    status.textContent = "";
    render();
  });

  document.querySelector("#copy-button").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(buildAgentCard(scores), null, 2)
      );
      status.textContent = COPY[language].copied;
    } catch {
      status.textContent = COPY[language].copyFailed;
    }
  });

  document.querySelector("#download-button").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(buildAgentCard(scores), null, 2)], {
      type: "application/json"
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "agent-card.json";
    link.click();
    URL.revokeObjectURL(link.href);
    status.textContent = COPY[language].downloaded;
  });

  document.querySelector("#share-button").addEventListener("click", async () => {
    const result = calculateScore(scores);
    const shareUrl = window.location.href;
    const shareData = {
      title: COPY[language].title,
      text: buildShareText(result, language),
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        status.textContent = COPY[language].shared;
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
      status.textContent = COPY[language].shared;
    } catch {
      status.textContent = COPY[language].shareFailed;
    }
  });

  render();
}

if (typeof document !== "undefined") {
  bootstrap();
}
