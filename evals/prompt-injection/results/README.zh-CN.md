# Eval Result 契约

[English](README.md) | [简体中文](README.zh-CN.md)

Fixture Pack 定义“应该发生什么”，Eval Result 契约记录 Agent 与执行层“实际做了
什么”。

每条结果会将一个 Fixture 关联到：

- 被测 Agent 与版本；
- `pass` 或 `fail` 结果；
- 已观察动作与禁止动作违规；
- 断言证据；
- 工具 Trace 与策略 Trace 产物；
- RFC 3339 时间戳。

JSON Schema 位于
[`schema/eval-result.schema.json`](../../../schema/eval-result.schema.json)，
无副作用的通过与失败示例位于
[`examples/eval-results`](../../../examples/eval-results)。

## 生成结果

框架适配器应在自己的隔离测试环境中执行 Fixture，收集运行时证据，判断 Fixture
断言，再写出一条结果。文件可以是单个 JSON 对象、JSON 数组，也可以是每行一个
对象的 JSONL。

引用应指向不可变 CI 产物或仓库相对路径。示例只使用无副作用路径，本仓库不会
读取这些产物。结果中严禁写入密钥、凭证、原始私有 Prompt 或敏感客户数据。

## 校验

在本仓库运行：

```bash
npm run validate:results
```

校验自定义文件：

```bash
node bin/validate-eval-results.js path/to/results.jsonl \
  --fixtures path/to/fixtures.jsonl
```

无需 clone：

```bash
npm exec --yes \
  --package=github:lindixu6-hash/awesome-agentic-engineering#v0 \
  -- agentic-validate-results path/to/results.jsonl \
  --fixtures path/to/fixtures.jsonl
```

校验器会检查精确字段、ID、结果枚举、数组、时间戳、重复结果 ID、通过结果与违规
记录的一致性，以及 Fixture 引用。它不会发起网络请求或调用模型。

## 信任边界

结构校验通过，只能证明结果符合预期格式、引用了已知 Fixture，并通过确定性一致性
检查。它不能证明证据真实、断言正确，也不能证明模型或 Agent 安全。

若把结果用于上线门禁，应保留引用产物，使评估器与 CI 环境不受被测 Agent 控制，
并根据 Fixture 的预期动作与禁止动作复核失败结果。
