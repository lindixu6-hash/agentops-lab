# 风险分级生产就绪 Profile

[English](README.md) | [简体中文](README.zh-CN.md)

单一总分会掩盖不同 Agent 的失败成本。这组可选 Profile 在不改变 Action 默认行为
的前提下，增加分项最低分、工具影响边界、审批要求和上线阻塞项策略。

机器可读定义位于
[`readiness-profiles.json`](readiness-profiles.json)，对应
[JSON Schema](../schema/readiness-profiles.schema.json)。

## Profile

| Profile | 最低总分 | 工具影响 | 审批要求 | 阻塞项 |
| --- | ---: | --- | --- | --- |
| `read-only` | 12/20 | `read_only` | 无强制审批 | 允许 |
| `draft-only` | 14/20 | `read_only`、`draft` | 禁止外部状态变更 | 失败 |
| `state-changing` | 17/20 | 所有已声明影响 | 每个 `external_state` 工具 | 失败 |

三个 Profile 还分别要求至少存在一个 `read_only`、`draft` 或
`external_state` 工具，防止高分卡片选择与真实能力不符的风险分类。

### 只读

适用于只能检索数据，不能写草稿、发消息、修改仓库或改变外部状态的 Agent。

由于直接影响较小，总分门槛为 12/20；但目标清晰度和工具权限都必须达到 2 分，
Eval、失败处理、安全与可观测性至少 1 分。因为不存在状态变更能力，上线阻塞项会
继续展示，但不会自动让该 Profile 失败。

取舍：读取能力仍可能暴露私有数据或放大不可信内容，因此“只读”不等于可以降低
安全要求。

示例：[`read-only-agent.card.json`](../examples/read-only-agent.card.json)。

### 仅草稿

适用于可以写入隔离草稿区，但不能发布、发送、合并、部署、删除、付款或改变任何
外部状态的 Agent。

人工审核必须达到 2 分，且任意上线阻塞项都会导致失败。即使某个
`external_state` 工具声明了人工审批，该 Profile 仍会禁止它，确保“仅草稿”是
能力边界，而不是依赖 Agent 自觉停止。

取舍：草稿仍可能包含不安全、隐私或无来源内容，审核者与目标平台适配器仍属于
安全边界。

示例：[`support-agent.card.json`](../examples/support-agent.card.json)。该示例
刻意保留原始 12/20 与两个阻塞项，因此当前无法通过此 Profile。

### 状态变更

适用于任意工具能改变外部系统的 Agent。每个此类工具必须声明
`effect: external_state` 与 `approval_required: true`。

该 Profile 要求总分 17/20，工具权限、Eval、失败处理、安全、可观测性与人工审核
都达到 2 分，并且不存在上线阻塞项。这些要求分别用于预防、检测、审批和恢复有害
操作。

取舍：元数据不能证明执行层真实执行了审批、授权范围、幂等或回滚，这些控制仍需
运行时证据。

示例：[`operations-agent.card.json`](../examples/operations-agent.card.json)。
该示例刻意保留原始 15/20 与三个阻塞项，因此当前无法通过此 Profile。

## 工具影响

启用 Profile 后，Agent Card 中每个工具都需要 `effect`：

- `read_only`：读取数据，不创建持久状态。
- `draft`：只写入隔离且未发布的草稿区。
- `external_state`：改变仓库、服务、账户、消息渠道、支付系统、生产环境或其他
  外部系统。

应按工具能力而不是预期用法分类。一个“可以发布”的工具，即使当前 Prompt 只要求
草稿，也属于 `external_state`。

## Action 用法

```yaml
- uses: lindixu6-hash/awesome-agentic-engineering@v0
  with:
    card: agent-card.json
    profile: "state-changing"
```

Profile 需要显式选择。未设置 `profile` 时，`min-score`、`fail-below` 和
`fail-on-blockers` 完全保持原有语义。设置后，Profile 最低总分会替代
`min-score`，其阻塞项策略可以开启严格失败，而且所有 Profile 要求都会 fail
closed。

未知 Profile、损坏定义、缺失工具元数据、越界工具影响或缺少外部状态审批都会让
Action 失败。Action 会在原有输出之外增加 `profile` 与 `profile-passed`。
