# Launch Posts

## English Short

Most AI agent demos fail in production for boring reasons: tool permissions, memory drift, missing evals, hidden costs, prompt injection, and no recovery path.

I made an open-source field guide for shipping agents that survive real users:

<repo-url>

It includes templates, a production-readiness scorecard, failure modes, and a tiny CLI.

## English Long

I keep seeing AI agent demos that look magical for five minutes, then fall apart when real users touch them.

The failure modes are usually not glamorous:

- Tool permissions are too broad
- Memory drifts
- Evals only cover happy paths
- Costs are invisible
- Prompt injection is ignored
- Nobody knows how the agent should fail

So I started Awesome Agentic Engineering: a practical open-source playbook for production-ready agents.

It includes:

- Agent Card template
- Eval Plan template
- Launch Checklist
- Production-readiness scorecard
- Failure mode library
- MCP safety checklist
- Zero-dependency CLI score tool

Repo: <repo-url>

## Chinese Short

大多数 AI Agent demo 不是死在模型能力上，而是死在工程细节上：工具权限、记忆漂移、缺少 eval、成本失控、提示注入、失败不可见。

我整理了一个开源项目：Awesome Agentic Engineering。

里面有 Agent Card、Eval Plan、上线检查清单、失败模式库和评分 CLI：

<repo-url>

## Chinese Long

我最近越来越觉得，AI Agent 从 demo 到生产，中间缺的不是更多 prompt，而是一套工程化清单。

很多项目看起来很酷，但一接真实用户就会出问题：

- 工具权限过大
- 记忆不断漂移
- 没有覆盖真实场景的 eval
- 成本不可见
- 外部内容提示注入
- 失败时没有恢复路径

所以我做了一个开源项目：Awesome Agentic Engineering。

它不是收集一堆酷炫 demo，而是专门整理“怎么把 Agent 真正上线”的模板、评分卡、失败案例和检查清单。

包含：

- Agent Card 模板
- Eval Plan 模板
- Launch Checklist
- 生产就绪评分卡
- 失败模式库
- MCP 安全检查清单
- 零依赖评分 CLI

Repo: <repo-url>
