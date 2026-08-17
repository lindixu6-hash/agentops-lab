# Production AI Skills 提交清单

## 项目资料

- 项目名：AgentOps Lab
- Skill 名：local-agentops
- 自定义标签：AI PC
- 赛题：Production AI Skills 大赛
- 截止时间：2026-08-31 23:59
- 代码仓库：https://github.com/lindixu6-hash/agentops-lab
- Demo：https://lindixu6-hash.github.io/agentops-lab/agentops/
- ModelScope Skill：https://modelscope.cn/skills/lindi312/local-agentops
- 技术文章：https://modelscope.cn/learn/435817

## 一句话介绍

一个隐私优先的本地 Agent 评测与运营 Skill：导入 CSV / JSON 日志，生成成功率、失败类型、版本、成本与延迟复盘，并通过 OpenVINO GenAI 在本机排序确定性建议。

## 评分映射

| 评分项 | 项目证据 |
| --- | --- |
| 场景价值 30% | AI 产品 / 运营上线后的失败归因、版本放量与复盘工作流 |
| 商用生产力 30% | 本地处理敏感日志；CSV/JSON 接入；Markdown/JSON 输出；用户任务验证 |
| 工具使用 20% | `local-agentops` Skill、OpenVINO GenAI、Qwen 本地模型、固定入口 |
| 文章质量 10% | 完整架构、数据协议、隐私边界、可复现命令和结论边界 |
| 创新性 10% | 确定性指标层 + 本地模型排序层；只向模型提供聚合数据和带 ID 的确定性建议 |
| 传播附加分 5% | ModelScope 研习社 + 小红书 + GitHub 数据台账 |

## 提交前必须完成

- [x] ModelScope 赛事报名成功并保存截图；
- [x] 新 GitHub 仓库公开，原 `awesome-agentic-engineering` 未被修改；
- [x] CI 全部通过；
- [x] GitHub Pages Demo 可访问；
- [x] ModelScope Skills 中心发布 `local-agentops`；
- [x] Skill 添加 `AI PC` 自定义标签；
- [ ] Windows / Intel 环境完成一次默认模型运行；
- [x] `--continue` 模型续传路径验证；
- [x] TRAE Work / WorkBuddy 类 Host 完成稳定调用；
- [x] 保存完整 Host 调用截图；
- [ ] 5 位真实用户记录完成，不含伪造或空白记录；
- [x] 技术文章发布到 ModelScope 研习社；
- [ ] 小红书发布并正确 @ 社区、添加指定话题；
- [ ] 记录各渠道阅读量和有效转化；
- [ ] 比赛作品提交成功并保存截图。

## 演示脚本（2 分钟）

### 0:00-0:20 问题

展示一张散乱日志表格：

> Agent 上线后，产品和运营经常能看到日志，却无法快速判断哪个版本可以放量、失败集中在哪、人工接管和成本是否失控。

### 0:20-0:45 导入

- 打开 AgentOps Lab；
- 强调原始文件在浏览器本地处理；
- 加载 30 条合成样例；
- 展示字段自动识别和有效记录数。

### 0:45-1:15 决策

- 展示成功率、P95、成本和人工接管率；
- 展示最高频失败类型；
- 对比 v1 与 v2；
- 展示 P0 / P1 / P2 迭代建议及证据。

### 1:15-1:40 Local AI Skill

- 在 Host 中调用 `local-agentops`；
- 展示 OpenVINO GenAI 本地模型；
- 强调模型只读取聚合指标，不读取原始 Prompt 和回复；
- 展示无云模型回退。

### 1:40-2:00 结果

- 下载 Markdown / JSON 报告；
- 展示真实用户测试指标；
- 展示代码、测试、PRD 和开源链接；
- 结束语：让 Agent 失败可见，让每次迭代有证据。

## 不能提前填写的内容

- 奖项、名次、入围；
- 5 位用户完成前的完成率、耗时和评分；
- 尚未发生的企业采用或商业合作；
- 页面访问量不能写成体验用户数；
- 合成样例结果不能写成真实业务提升。
