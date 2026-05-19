# 12-Factor Agent Principles — ION DEX Dead Law

**来源：** https://github.com/humanlayer/12-factor-agents (20.5K ⭐)
**指令：** Master 死命令，Cursor 编码时严格执行以下 12 条原则。不是建议，是铁律。

---

## 控制 (Control)

### Factor 1: Natural Language → Tool Calls
LLM 把自然语言转成工具调用。人在 IDE 里说话 → Agent 翻译成具体命令 → 执行。
**禁止：** Agent 自己做推理后直接改文件不汇报。
**必须：** 先输出计划 → 等待执行 → 汇报结果。

### Factor 2: Own Your Prompts
自己控制 prompt，不依赖框架黑盒。
**禁止：** 用任何第三方 prompt 模板而不审查。
**必须：** 所有 prompt 显式写在规则文件或任务描述中，可控可调。

### Factor 3: Own Your Context Window
精心控制塞进 LLM 注意力的内容。多了会进"痴呆区"。
**禁止：** 把整个 codebase dump 进 context window。
**必须：** 只取任务相关的文件。SESSION_STATE.md 里只放当前 Task 要点，不堆历史。

---

## 上下文 (Context)

### Factor 4: Tools as Structured Outputs
工具调用 = 结构化输出。LLM 决定调用哪个工具 → 确定性代码执行 → 结果追加到 context。
**必须：** 每次工具调用返回结构化日志（成功/失败/耗时/输出摘要）。

### Factor 5: Unify Execution & Business State
执行状态和业务状态合一，不要并行状态系统。
**必须：** 所有状态写入 SESSION_STATE.md 和 docs/99-current-progress.md，单一真实来源。

### Factor 6: Launch / Pause / Resume
挂起/恢复机制。Agent 可以暂停等待人工输入，不丢上下文。
**必须：** 遇到需要人工确认的操作 → 暂停 → 写入待办 → 等确认后恢复。不死循环。

---

## 接口 (Interface)

### Factor 7: Contact Humans with Tool Calls
人工介入是设计特性，不是故障。
**必须：** 在以下情况主动请求 Master 确认：发送交易、修改主网配置、删除文件、更改变更安全设置。

### Factor 8: Own Your Control Flow
明确控制流，不交给 agent loop 全权负责。
**禁止：** 写一个死循环让 LLM 自己决定下一步。
**必须：** 每个 Task 有明确的 DAG：输入 → 步骤 1 → 步骤 2 → ... → 输出 → 验证 → commit。

### Factor 9: Compact Errors into Context
错误信息精炼，不是堆完整堆栈。
**必须：** 报错时：错误类型（1 行）+ 根因（1 行）+ 修复方案（1 行）。不超过 3 行。

---

## 架构 (Architecture)

### Factor 10: Small, Focused Agents
多个小 Agent，各管一摊，不搞单体。
**必须：** 一个 Task = 一个 Agent 职责。不把"编译合约 + 压力测试 + 写文档"塞进一个 session。

### Factor 11: Trigger from Anywhere
Agent 从任何地方触发—— git hook、cron、IDE 输入、人工消息。
**必须：** 每个 Task 结束后主动检查下一个 Task，自己不闲着。

### Factor 12: Stateless Reducer
Agent 是纯函数：输入状态 → 确定性转换 → 输出状态。不存中间态。
**必须：** 每次运行从 SESSION_STATE.md 读当前状态 → 执行 → 更新 SESSION_STATE.md。不依赖"上次我记住了"。

---

## 铁律（ION DEX 专属）

1. **编译即验证** — 写完 .fc 立刻编译，报错立刻修，不攒着
2. **100-pass 全绿** — 压力测试不过 100 次不算完
3. **每步 commit** — 5-10 分钟一次 git commit，可追溯
4. **不留 TODO** — 发现的漏洞当场修，不在代码里留 TODO 标记
5. **按图施工** — 严格对照 docs/03-technical-architecture.md，不自行发挥
6. **UI 从 react-bits 取** — 不凭空设计前端组件
7. **先搜 GitHub** — 不确定怎么实现先搜开源项目，不自己造轮子
8. **装全跑通** — 依赖装全，服务真正跑起来才算完
