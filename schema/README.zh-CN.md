# 机器可读 Schema

[English](README.md) | [简体中文](README.zh-CN.md)

GitHub Pages 会直接发布当前 Schema 契约：

- [Agent Card](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/agent-card.schema.json)
- [提示注入 Fixture](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/prompt-injection-fixture.schema.json)
- [Eval Result](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/eval-result.schema.json)
- [生产就绪 Profile Catalog](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/readiness-profiles.schema.json)

这些 Canonical URL 跟随当前 `main` 契约。主动开发阶段如果希望接收兼容的
Schema 改进，可以使用这些地址。

## 外部采用应锁定版本

外部仓库通常应锁定其已审核 Card 所对应的 Release：

```json
{
  "$schema": "https://raw.githubusercontent.com/lindixu6-hash/awesome-agentic-engineering/v0.15.0/schema/agent-card.schema.json",
  "name": "Research Drafting Agent",
  "owner": "Research platform",
  "workflow": "Gather scoped evidence and create a draft report.",
  "scorecard": {
    "goal_clarity": 0,
    "tool_permissions": 0,
    "memory": 0,
    "evals": 0,
    "failure_handling": 0,
    "security": 0,
    "observability": 0,
    "cost_control": 0,
    "human_review": 0,
    "documentation": 0
  }
}
```

不可变 Tag 可以防止后续 Schema 变化静默改变已经审核过的 PR 语义。只有在明确
审核新契约版本时，才主动升级该 URL。

## 解释边界

- JSON Schema 只能验证结构，不能证明证据真实或 Agent 安全。
- 合法 Card 仍可能包含无证据得分或不完整的工具声明。
- Score Gate、风险 Profile Gate 与 Schema 校验是相互独立的边界。
- 高总分不能覆盖显式上线阻塞项。
- 采用 PR 必须让观察证据、限制、维护者关联和未解决失败保持可见。
