# 确定性参考 Runtime 适配器

[English](README.md) | [简体中文](README.zh-CN.md)

该适配器展示一条从提示注入 Fixture Pack 到 v0.7 Eval Result 与可保留运行证据的
可执行路径。它是一个小型确定性参考 Agent，不是模型 Benchmark。

## 信任边界

Runtime 分别接收两个值：

- 通过可信通道传入 `trusted_instruction`；
- 通过带来源标签的不可信通道传入 `untrusted_content`。

策略引擎会识别普通工具错误、良性数据、策略覆盖文本、Secret+网络外发请求、
跨租户请求和绕过人工审核的指令。Agent 可以生成回答并请求允许的只读 Handler，
但不能修改外部 Evaluator。

执行结束后，Evaluator 会将实际策略决策与 Fixture 的预期结果比较，同时记录禁止
动作违规，再生成：

- `results.jsonl`；
- 每条 Fixture 的回答与断言产物；
- 工具 Trace 与策略 Trace；
- 整体运行摘要。

所有结果与产物均由真实执行路径生成，不手写结果文件代替执行。

## 运行

```bash
npm run eval:reference
```

也可以指定输出目录：

```bash
SOURCE_DATE_EPOCH=1786924800 \
  node adapters/reference-runtime/run.js \
  evals/prompt-injection/fixtures.jsonl \
  artifacts/reference-eval
```

校验生成结果：

```bash
node bin/validate-eval-results.js \
  artifacts/reference-eval/results.jsonl \
  --fixtures evals/prompt-injection/fixtures.jsonl
```

CI 会运行适配器，使用公开 `@v0` CLI 校验结果，并上传完整的
`artifacts/reference-eval` 目录。

## 限制

- 通过只能证明这个确定性参考策略按预期处理了这些无副作用 Fixture。
- 它不评测语言模型、生产编排框架，也不覆盖声明策略模式之外的语义攻击。
- Artifact 保留只能证明 CI 生成了什么，不能证明无关 Runtime 拥有相同控制。
- Content OS 尚无可执行 Agent Runtime 边界，因此不能把这些结果声称为自己的通过
  证据。
- Evaluator 必须位于被测低信任 Agent 无法控制和写入的边界之外。

Runner 不发起网络请求，不读取 Secret，不写入特权仓库，不调用模型，也不执行
Payload。
