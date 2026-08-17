# AgentOps Lab 成果与简历证据台账

> 更新日期：2026-08-17  
> 原则：只使用可公开核验的事实；合成样例、页面浏览量和空白用户记录不能写成业务结果。

## 已验证成果

| 成果 | 当前事实 | 公开证据 | 简历可用 |
| --- | --- | --- | --- |
| 独立比赛项目 | 从 `awesome-agentic-engineering` 派生出隔离仓库，原仓库保持不变，upstream 禁止 push | [GitHub 仓库](https://github.com/lindixu6-hash/agentops-lab) | 是 |
| 一页 PRD | 定义目标用户、北极星指标、输入协议、决策规则和 MVP 验收标准 | [PRD](agentops-lab-prd.zh-CN.md) | 是 |
| Web MVP | 浏览器本地导入 CSV/JSON，生成成功率、失败类型、版本、延迟、成本和人工接管分析 | [在线 Demo](https://lindixu6-hash.github.io/agentops-lab/agentops/?sample=1) | 是 |
| Agent Skill | `SKILL.md`、固定入口、输入输出协议、失败处理和本地模型链路完整 | [ModelScope Skill](https://modelscope.cn/skills/lindi312/local-agentops) | 是 |
| OpenVINO 本地推理 | Qwen2.5-0.5B OpenVINO FP16 IR 在 CPU 上连续运行三次成功 | [验证记录](openvino-validation.zh-CN.md) | 是 |
| 生产力 Host 集成 | TRAE Work 识别并调用 `local-agentops`，固定入口返回 `exit code 0` | [Host 证据](assets/traework-host-validation-v3.jpg) | 是 |
| 断点续跑 | `--continue` 恢复待续状态，生成 Markdown/JSON，完成后删除 pending 文件 | [验证记录](openvino-validation.zh-CN.md#断点续跑验证) | 是 |
| 自动化质量门禁 | 核心解析、指标、报告与 README 契约有自动化测试；GitHub CI 已通过 | [Actions](https://github.com/lindixu6-hash/agentops-lab/actions) | 是 |
| 技术文章 | ModelScope 研习社文章已公开，专题为 `Intel AI PC` | [技术文章](https://modelscope.cn/learn/435817) | 是 |
| 用户研究准备 | 已公开 10 分钟任务、同意口径、成功条件和匿名记录协议 | [首测脚本](../research/first-5-users.md) / [招募 Issue](https://github.com/lindixu6-hash/agentops-lab/issues/1) | 是 |

## 性能与样例边界

以下数字来自本机对 **30 条合成记录** 的技术验证，只能用于说明可复现性：

- 完整冷启动耗时：20.27 秒；
- 峰值内存：约 1.26 GB；
- 有效记录：30；
- 样例成功率：73.3%；
- 样例失败记录：8；
- 样例最高频错误：`tool_error`，4 次；
- 样例 P95 延迟：9400 ms。

这些数字不能表述为真实用户、真实业务效果、提效比例或成本节省。

## 尚未完成

| 项目 | 完成证据 | 当前状态 |
| --- | --- | --- |
| Production AI Skills 正式提交 | 官方提交成功页或回执截图 | 表单作品字段已填写；待本人补充隐私资料 |
| 小红书传播 | 公开笔记 URL | 5 张卡片已准备；待本人短信登录后发布 |
| 5 位真人首测 | 5 条有明确同意记录的有效匿名数据 | 招募中，当前为 0/5 |
| Intel AI PC GPU/NPU 验证 | 目标硬件命令、版本、耗时和输出 | 未补测 |
| 传播附加分 | 截止日期前各公开渠道累计阅读量 | 未统计 |

## 当前可用简历表述

### AI 产品 / 运营方向

**AgentOps Lab｜AI Agent 评测与运营产品负责人**

- 从 Agent 上线后“日志多但难以形成放量决策”的问题出发，完成一页 PRD、数据协议与北极星指标设计，交付支持 CSV/JSON 本地导入、失败归因、版本对比、成本/延迟分析及 Markdown/JSON 报告导出的 MVP。
- 采用“确定性指标 + 本地小模型排序”架构，将原始 Prompt、回复和业务日志限制在本机；基于 OpenVINO GenAI 部署 Qwen2.5-0.5B FP16 IR，并在 TRAE Work 中完成 Agent Skill 稳定调用验证。
- 建立可复现的合成数据、自动化测试、断点续跑与隐私同意机制，公开发布 GitHub Demo、ModelScope Skill 和 Intel AI PC 专题技术文章；设计 5 位目标用户的 10 分钟可用性测试并启动招募。

### 补齐真人数据后的量化版本

仅在 `research/first-5-users.csv` 存在 5 条有效记录后替换：

- 组织 `[N]` 位 Agent 开发者 / AI 产品运营完成任务测试，任务完成率 `[X%]`、中位耗时 `[X]` 分钟、问题判断正确率 `[X%]`、报告平均有用度 `[X/5]`，据此识别 `[最高频卡点]` 并推动 `[产品迭代]`。

### English

**AgentOps Lab | AI Agent Evaluation & Operations Product Lead**

- Defined the one-page PRD, data contract, and north-star workflow for a local-first Agent operations product; shipped CSV/JSON ingestion, failure diagnosis, version comparison, cost/latency analysis, and reproducible Markdown/JSON reports.
- Designed a deterministic-metrics-plus-local-model architecture that keeps raw prompts and business logs on-device; deployed Qwen2.5-0.5B as OpenVINO FP16 IR and verified stable invocation as a TRAE Work Agent Skill.
- Built synthetic fixtures, automated tests, resumable execution, and privacy-consent protocols; published the GitHub demo, ModelScope Skill, and an Intel AI PC technical article, then launched a five-user usability study.

## AI-901 与免费凭证

- Microsoft Azure AI Fundamentals（AI-900/相关 Fundamentals 考试）常态需要付费，价格随地区变化；
- 免费学习路径、Practice Assessment 和 Sandbox 不等于正式认证；
- 优先选择 Microsoft Learn 免费内容和可免费完成的 Microsoft Applied Skills；
- 只有获得 100% Voucher 时，再把付费 Fundamentals 考试列入当前冲刺计划；
- 详见 [免费 AI 凭证路线](free-ai-credentials.zh-CN.md)。
