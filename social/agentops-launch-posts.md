# AgentOps Lab 一稿多用传播素材

> 发布前替换所有 `[真实数据]`。未完成用户测试前，不得填写或暗示虚构结果。

## 小红书标题备选

1. 我把 Agent 失败复盘做成了一个本地 AI Skill
2. 别再只看准确率：一张表复盘 Agent 能不能放量
3. AI 产品经理怎么做 Agent 上线后的数据飞轮

## 小红书正文

做 Agent Demo 不难，难的是上线后回答这几个问题：

- 新版本真的变好了吗？
- 失败到底集中在哪？
- 人工接管是风险控制，还是系统不稳定？
- 失败任务是不是反而更贵、更慢？

我做了一个本地优先的 Agent 评测与运营工作台 AgentOps Lab。

导入 CSV / JSON，它会自动生成：

✓ 成功率、P95 延迟、成本、人工接管率  
✓ 失败类型分布  
✓ Prompt / Agent 版本对比  
✓ P0 / P1 / P2 迭代建议  
✓ Markdown / JSON 复盘报告

隐私上做了两个限制：

1. 浏览器本地解析，不上传原始日志；
2. OpenVINO 本地模型只读取聚合指标，不读取原始 Prompt 和回复。

当前公开数字来自 30 条合成样例，只用于验证计算链路，不代表真实业务提升。
5 位真人首测正在招募中，真实结果出现前不填写完成率、耗时或用户引语。

项目已开源，评论“AgentOps”获取 Demo、技术文章和测试数据。

#英特尔 #openvino #魔搭 #agentic #skills #AI产品经理 #AI运营

发布要求：

- @OpenVINO中文社区
- @魔搭ModelScope社区
- 配图 1：工作台总体指标；
- 配图 2：失败类型与版本对比；
- 配图 3：本地 Skill 架构；
- 配图 4：真实用户测试结果，不展示个人信息。

## 知乎 / 掘金导语

AI Agent 上线后的运营，不能停留在“挑几条对话看起来不错”。本文分享一个本地优先的 AgentOps 实践：如何把 CSV / JSON 运行日志转成可复现指标，如何区分确定性计算与本地模型排序，以及如何用 5 位目标用户验证这份报告是否真的支持版本放量决策。

完整文章：

- `https://modelscope.cn/learn/435817`

## GitHub Release

### v0.1.0 - Local-first Agent operations report

AgentOps Lab turns exported Agent runs into a reproducible operations report without uploading raw logs.

Included:

- CSV and JSON import with common field aliases;
- task success, P95 latency, cost, rating, and human-handoff metrics;
- failure taxonomy and prompt / Agent version comparison;
- evidence-linked P0 / P1 / P2 recommendations;
- Markdown and JSON exports;
- browser-local MVP and zero-dependency Node.js CLI;
- `local-agentops` OpenVINO GenAI skill;
- synthetic sample data, automated tests, one-page PRD, and user-test protocol.

Privacy:

- raw prompts and responses are excluded from reports by default;
- the local model receives aggregate metrics only;
- there is no cloud-model fallback.

## V2EX / 即刻短版

做了一个本地优先的 AgentOps 工具：导入 CSV / JSON 日志，自动算成功率、P95、成本、人工接管率，做失败归因和版本对比，再生成 Markdown 报告。

基础指标用确定性代码计算，本地 Qwen + OpenVINO 只负责从规则建议中排序；最终证据与行动由代码原样渲染。原始日志不上传，也不回退云模型。

正在找 5 位做过 Agent / LLM 产品的人做 10 分钟首测，使用合成数据即可。项目和测试脚本都开源：`https://github.com/lindixu6-hash/agentops-lab`

## 私聊招募

我在测试一个完全本地处理数据的 Agent 评测工具。它可以导入 CSV / JSON 日志，自动生成成功率、失败类型、版本对比、成本和延迟复盘。

想找 5 位最近做过 AI Agent / LLM 产品的人完成一次 10 分钟可用性测试，不需要提供真实业务数据，使用合成样例即可。测试只记录匿名任务结果，完成后我会把最终评测模板和报告发给你。

愿意参加的话回复“可以”，我会发匿名编号和任务链接。

## 发布数据台账

| 渠道 | 发布时间 | 链接 | 曝光 | 访问 | Demo 激活 | 报告下载 | 有效反馈 |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: |
| ModelScope 研习社 | 2026-08-17 | https://modelscope.cn/learn/435817 |  | 16 |  |  |  |
| 小红书 | 2026-08-18 | https://www.xiaohongshu.com/explore/6a834e60000000002402fe82 |  | 51 |  |  |  |
| 知乎 / 掘金 |  |  |  |  |  |  |  |
| GitHub |  |  |  |  |  |  |  |

> 2026-08-17 基线：研习社公开 API 返回浏览量 16、喜欢 0；GitHub 仓库
> star 0、fork 0、公开招募 Issue 1 条。浏览量和 star 不能计为真实用户或有效反馈。
>
> 2026-08-18：Production AI Skills 官方表单已提交成功。小红书已完成登录，
> 草稿含 5 张互不重复的卡片、标题、547 字正文、文章与 Skill 链接；两次发布
> 请求均在官方 `POST /web_api/sns/v2/note` 阶段 15 秒超时，笔记管理页仍为
> 0 篇，因此不计为已发布。
>
> 同日 02:09，用户完成发布。管理后台核验标题为“我把Agent复盘做成了本地Skill”，
> 无“仅自己可见”标记；归档时显示 51 次浏览。公开笔记 ID：
> `6a834e60000000002402fe82`。
