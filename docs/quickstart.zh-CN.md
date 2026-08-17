# 五分钟接入 CI 门禁

[English](quickstart.md) | [简体中文](quickstart.zh-CN.md)

无需 clone 本仓库，一条命令生成 Agent Card 与 GitHub Actions 工作流：

```bash
npm exec --yes \
  --package=github:lindixu6-hash/awesome-agentic-engineering#v0 \
  -- agentic-init \
  --profile draft-only \
  --name "Support Drafting Agent"
```

该命令零依赖，会生成：

```text
agent-card.json
.github/workflows/agent-readiness.yml
```

没有 Node.js 或 npm，也可以直接下载对应 Profile 的两个文件：

| Profile | Agent Card | 工作流 |
| --- | --- | --- |
| `read-only` | [下载 JSON](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/read-only/agent-card.json) | [下载 YAML](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/read-only/agent-readiness.yml) |
| `draft-only` | [下载 JSON](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/draft-only/agent-card.json) | [下载 YAML](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/draft-only/agent-readiness.yml) |
| `state-changing` | [下载 JSON](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/state-changing/agent-card.json) | [下载 YAML](https://lindixu6-hash.github.io/awesome-agentic-engineering/starters/state-changing/agent-readiness.yml) |

将所选 JSON 保存为 `agent-card.json`，将 YAML 保存为
`.github/workflows/agent-readiness.yml`。这些下载文件与初始化器使用同一契约，
CI 会逐字节检查二者一致。每份生成 Card 还会声明
[Canonical Agent Card Schema](https://lindixu6-hash.github.io/awesome-agentic-engineering/schema/agent-card.schema.json)，
供编辑器与 CI 校验。

选择一个风险 Profile：

| Profile | 适用情况 |
| --- | --- |
| `read-only` | 所有工具只能读取有范围的数据 |
| `draft-only` | Agent 可以写隔离草稿，但不能发布 |
| `state-changing` | 工具可以改变外部系统，而且必须审批 |

## 第一次运行就应该失败

生成的卡片会刻意保持“未生产就绪”：

- 10 项评分全部从 `0` 开始；
- 用户、负责人、工作流、非目标和工具用途都包含 `TODO`；
- 保留一个显式上线 blocker；
- 工作流启用严格 blocker 失败模式。

这样可以避免 Starter 模板被误用成虚假的生产就绪证据。第一次 CI 应报告：

```text
Score: 0/20
Profile passed: false
Launch blockers: 1
```

## 让门禁真正有效

1. 将所有 `TODO` 替换为有边界、可审核的事实。
2. 用真实工具能力和 effect 替换占位工具。
3. 用非目标禁止 Agent 不应拥有的权限。
4. 根据证据给每项打 0–2 分，而不是根据意图打分。
5. 关联 Eval Fixture、Trace、审批记录、预算与恢复测试。
6. 只有在要求真实满足后，才删除 Starter blocker。

[10 项生产就绪门槛指南](https://lindixu6-hash.github.io/awesome-agentic-engineering/zh/guide/)
解释了每项分数需要什么证据。

## 默认保护已有文件

`agentic-init` 会在写入前同时检查两个目标路径。如果
`agent-card.json` 或 `.github/workflows/agent-readiness.yml` 任意一个已存在，
命令会退出，两个文件都不会被修改。

`--force` 会覆盖两个路径，因此必须显式传入：

```bash
agentic-init --profile read-only --force
```

使用前应先审核并提交已有文件。该命令不会修改仓库中的其他文件。
