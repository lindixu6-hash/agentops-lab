# 贡献指南

[English](CONTRIBUTING.md) | [简体中文](CONTRIBUTING.zh-CN.md)

感谢你帮助改进 Awesome Agentic Engineering。本仓库优先接收可执行、有来源的
生产证据，而不是堆叠功能数量或宽泛结论。

## 贡献路径

### 采用生产就绪门禁

当另一个公开仓库使用 Agent Card、分数门禁、风险 Profile、Fixture 契约或 Result
校验器时，请使用
[Agent Card 采用表单](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/new?template=agent-card-adoption.yml)。

请提供：

- 消费仓库与公开 Workflow Run；
- 有边界的 Agent 工作流与所选风险 Profile；
- 真实分数、blocker 与失败门禁；
- 维护者关联关系与共同所有权。

不要求全部通过。保留真实技术债的失败审计，比手工修改出来的绿色 Badge 更有
证据价值。

### 增加 Runtime 适配器

实现前先在
[开放的 CrewAI 适配 Issue](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/16)
留言，或使用
[Runtime 适配器提案表单](https://github.com/lindixu6-hash/awesome-agentic-engineering/issues/new?template=runtime-adapter.yml)。

适配器必须：

- 锁定一个持续维护的开源 Runtime；
- 执行该 Runtime 的真实编排原语；
- 将可信值与带来源标签的不可信值分开；
- 运行全部 8 条恶意与良性 Fixture；
- 根据观察状态生成 Result，不能手写 verdict；
- 在 CI 中保留回答、断言、工具 Trace 和策略 Trace；
- 包含一条真实产出 `fail` 的负向回归；
- 让 Evaluator 断言位于 Agent 可控路径之外；
- 不使用真实 Secret、特权 Token、模型 API Key 或危险 Payload。

### 增加生产事故

使用生产失败表单，链接一手来源，并区分真实事故、已披露漏洞、红队演示和研究
PoC。将证据转换成检测信号、控制措施与 Given/When/Then 回归测试。

### 改进契约、模式或指南

高价值贡献包括：

- 可重复 Eval 场景与良性对照；
- 权限、审批、记忆、成本与恢复边界；
- 带来源的事故回归；
- 机器可读 Schema 与校验器；
- 带公开 CI 证据的窄场景示例；
- 英文或中文文档修正。

## 中英文同步

面向用户的工作流必须保持英文与简体中文导航同步。无需逐行直译，但必须提供：

- 英文入口与简体中文入口，或与维护者约定的明确后续计划；
- 双向语言链接；
- 两种语言中一致的能力、限制与安全结论。

机器可读 Schema、JSONL Fixture、源码和 CLI 输出保持语言无关。

## 证据规则

- 将观察行为与解释分开。
- 保持未解决的上线 blocker 可见。
- 不得根据 Star、CI 状态、示例或作者自营证据推断生产采用。
- 不得声称结构校验可以证明 Agent 安全。
- 不得将确定性策略适配器包装成 LLM Benchmark。
- 如果贡献者同时维护本仓库与消费者/提交项目，必须披露关联关系。

## 本地验证

使用 Node.js 20 或更高版本：

```bash
npm run install:langgraph
npm test
npm run validate:fixtures
npm run validate:results
```

修改 LangGraph 适配器时：

```bash
SOURCE_DATE_EPOCH=1786924800 npm run eval:langgraph
node bin/validate-eval-results.js \
  artifacts/langgraph-eval/results.jsonl \
  --fixtures evals/prompt-injection/fixtures.jsonl
```

所有变更都要运行：

```bash
git diff --check
```

## Pull Request

- 每个 PR 只解决一个行为目标。
- 链接推动该变更的 Issue 或证据。
- 测试范围应与风险相匹配。
- 保留与任务无关的现有工作树变更。
- 明确限制与未完成事项。
- 不得在未重新计算时更新生成计数、分数或结论。

## 不接受的内容

- 编造的 Benchmark 或采用数据；
- 付费收录、联盟链接、互动交换或互 Star；
- 真实 Secret、可工作的外泄端点或危险 Payload 执行；
- 通过隐藏 blocker 或夸大证据获得的高分；
- 与贡献无关的依赖或元数据变更。

## 安全问题

可能暴露用户的漏洞不要提交公开 Issue，请遵循 [SECURITY.md](SECURITY.md)。

## License

提交贡献即表示你同意该贡献使用本仓库的 MIT License。
