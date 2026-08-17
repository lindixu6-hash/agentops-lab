# 我把 Agent 评测做成了一个本地 Skill：从运行日志到可执行复盘

> 参赛项目：AgentOps Lab  
> 赛道：Production AI Skills  
> 标签：Intel AI PC、OpenVINO、ModelScope、Agentic AI、Local AI

## 为什么做这个产品

AI Agent 上线后的运营经常陷入一个矛盾：日志很多，但真正能指导迭代的信息很少。

团队通常能看到调用记录，却很难快速回答这些产品问题：

- 新 Prompt / Agent 版本真的变好了吗？
- 成功率下降主要由哪个失败类型造成？
- 人工接管是在处理必要风险，还是补偿系统不稳定？
- 失败任务是否反而消耗了更多 Token 和工具调用？
- 一批日志到底应该先修什么，什么时候可以继续放量？

现有可观测性平台更关注 Trace 和工程诊断。对产品经理和运营人员来说，仍然需要把日志导出到表格，手工计算指标、筛选失败、写复盘。业务日志又可能包含敏感信息，不适合直接上传到未知的第三方服务。

因此我做了 AgentOps Lab：一个本地优先的 Agent 评测与运营工作台。

## 它如何工作

用户只需要导入 CSV 或 JSON 日志，就能获得：

1. 任务成功率、失败数和人工接管率；
2. 平均延迟、P95 延迟、总成本和单次平均成本；
3. 失败类型分布；
4. Prompt / Agent 版本对比；
5. 带证据的 P0 / P1 / P2 迭代建议；
6. 可下载的 Markdown 和 JSON 复盘报告。

浏览器版完全在本地解析文件，不上传原始日志。Skill 版进一步通过 OpenVINO GenAI 在本机运行 Qwen2.5 0.5B OpenVINO FP16 IR，只把聚合指标和确定性建议 ID 交给模型排序，不把原始 Prompt、回复或用户信息放入模型上下文。

## 为什么不是“让大模型读完整日志”

这是一个刻意的产品约束。

直接把完整日志塞进模型存在四个问题：

- 隐私：日志可能包含用户内容、密钥、客户名和内部数据；
- 成本：大量重复 Trace 会浪费上下文；
- 可复现性：同一批日志的基础指标不应因采样而变化；
- 可信度：模型可能把相关性写成因果关系。

所以 AgentOps Lab 使用两层分析：

**第一层：确定性计算**

- 字段别名识别与数据校验；
- 成功率、P95、成本、人工接管率；
- 失败计数和版本对比；
- 基于明确阈值生成建议。

**第二层：本地模型排序**

- 只读取第一层的聚合 JSON；
- 从确定性建议中选择最多三个 ID；
- 最终文本由代码原样渲染证据与行动，模型不能新增事实或方案；
- 模型不可用时绝不回退到云服务。

## 本地 Skill 结构

```text
skills/local-agentops/
├── SKILL.md
├── info.json
├── meta.json
├── requirements.txt
└── scripts/
    ├── install-env.ps1
    ├── run.ps1
    ├── run.sh
    ├── run.py
    └── client.py
```

`scripts/run.ps1` 是唯一入口：

```powershell
scripts\run.ps1 "runs.csv" --output "report.md" --json "metrics.json"
```

第一次运行会建立 Python 环境并下载本地 Qwen 模型。下载中断时可以使用：

```powershell
scripts\run.ps1 --continue
```

为了测试和审计，项目同时保留透明的 `--no-model` 模式。它只运行确定性计算，并在报告中明确标注没有使用本地模型。

## 数据协议

最小输入只要求结果字段：

```csv
task_id,success,latency_ms,cost_usd,human_review,error_type,prompt_version,user_rating
run-001,true,3100,0.018,false,,v1,4
run-002,false,9400,0.047,true,tool_error,v1,2
```

系统同时识别 `status`、`passed`、`duration_ms`、`human_handoff`、`error_category` 和 `agent_version` 等常见别名，降低接入成本。

## 首轮验证设计

我没有把“页面能打开”当作产品完成，而是定义了一个用户任务：

> 导入一批 Agent 运行日志，判断哪个版本能否继续放量，找出最优先的问题，并下载一份复盘报告。

首轮计划邀请 5 位最近调试过 Agent 的开发者、AI 产品或运营人员测试，记录：

- 是否完成导入、诊断、版本判断和报告下载；
- 完成任务耗时；
- 首要问题判断是否正确；
- 报告有用度（1-5 分）；
- 是否愿意再次使用；
- 经本人确认可公开引用的匿名反馈。

真实结果将在完成测试后补充：

| 指标 | 结果 |
| --- | ---: |
| 有效参与者 | `[待真实测试]` |
| 任务完成率 | `[待真实测试]` |
| 中位耗时 | `[待真实测试]` |
| 问题判断正确率 | `[待真实测试]` |
| 报告平均有用度 | `[待真实测试]` |
| 再使用意愿 | `[待真实测试]` |

在结果出现前，项目不会把空白记录、模拟角色或页面浏览量写成真实用户数据。

## 当前结果

项目已完成：

- 零依赖 Node.js CLI；
- 浏览器本地 CSV / JSON 导入；
- 30 条合成日志示例；
- Markdown / JSON 报告；
- 自动化测试；
- 本地 OpenVINO Skill 结构；
- OpenVINO 原生 IR 冷启动实跑：30 条记录完整分析耗时 20.27 秒，峰值内存约 1.26 GB；
- 一页 PRD、首轮用户测试脚本和隐私同意口径。

示例数据的结果只用于验证计算链路，不代表真实业务效果：

- 有效记录：30；
- 任务成功率：73.3%；
- 最高频失败：`tool_error`；
- 系统会触发 P0 失败模式修复建议和版本对比。

## 下一步

1. 完成 5 位真实用户的首轮测试；
2. 将最高频卡点转成产品迭代；
3. 在 Intel AI PC 上补充 GPU / NPU 推理耗时与内存；
4. 将已完成的 TRAE Work Host 调用剪成 2 分钟演示；
5. 将真实失败样本转成可公开、脱敏的回归 fixtures。

## 项目链接

- GitHub：`https://github.com/lindixu6-hash/agentops-lab`
- 在线 Demo：`https://lindixu6-hash.github.io/agentops-lab/agentops/`
- Local Skill：`skills/local-agentops/`
- 一页 PRD：`docs/agentops-lab-prd.zh-CN.md`

Agent 真正进入生产以后，最重要的问题不再是“它能不能回答”，而是“它在什么条件下会失败，失败是否可见，我们能否用证据决定下一次迭代”。
