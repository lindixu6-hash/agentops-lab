# LangGraph.js Eval 适配器

[English](README.md) | [简体中文](README.zh-CN.md)

该适配器使用真实的
[`@langchain/langgraph`](https://github.com/langchain-ai/langgraphjs)
`StateGraph` 运行提示注入 Fixture Pack，并生成本仓库 v0.7 Eval Result 契约。

LangGraph.js `1.4.10` 被锁定在独立子包中，因此评分、Badge、Fixture 与 Result CLI
仍保持零依赖。

## Graph

每条 Fixture 会转换成包含以下独立字段的 LangGraph State：

- `trustedInstruction`；
- `untrustedSource`；
- `untrustedContent`；
- 预期结果。

Graph 会执行两个节点：

1. `classify_untrusted_content` 执行确定性策略，并记录可信/不可信通道事件。
2. `produce_response` 生成有边界的回答，并记录允许的工具活动。

外部 Evaluator 在 `graph.invoke()` 结束后运行，将观察到的决策与 Fixture 契约
比较，再生成 Result、回答、断言、工具 Trace 与策略 Trace。

## 安装与运行

```bash
npm ci --prefix adapters/langgraph

SOURCE_DATE_EPOCH=1786924800 \
  node adapters/langgraph/run.js \
  evals/prompt-injection/fixtures.jsonl \
  artifacts/langgraph-eval
```

校验生成结果：

```bash
node bin/validate-eval-results.js \
  artifacts/langgraph-eval/results.jsonl \
  --fixtures evals/prompt-injection/fixtures.jsonl
```

CI 会安装锁定的子包、运行全部 8 条 Fixture、使用公开 `@v0` CLI 校验结果，并
上传 `langgraph-eval-evidence`。

## 可以证明什么

- 每条 Fixture 都由真实 LangGraph `StateGraph` 执行两个节点。
- 可信与不可信值保持为独立 Graph State 字段。
- Evaluator 根据观察到的 Graph State 生成结果。
- 工具与策略 Trace 标明了生成事件的 LangGraph 节点。
- 强制制造预期/实际不一致时会产出失败结果。

## 不能证明什么

- 它不是 LLM Benchmark。策略节点是确定性的，不调用模型。
- 它不能证明任意 LangGraph 应用都安全。
- 它不测试声明策略模式之外的语义攻击。
- 它不能证明生产部署将 Evaluator 保持在 Agent 可写工作区之外。
- 它不会把结果转移给 Content OS 或其他采用项目。

Runner 不使用 API Key、网络工具、Secret、特权 Token 或危险 Payload。LangGraph
是被验证的编排 Runtime；策略行为保持确定性，以保证 CI 可复现且不受模型供应商
波动影响。
