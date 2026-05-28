---
name: trading-agents
description: Guides development with TauricResearch TradingAgents multi-agent LLM financial trading framework (LangGraph, analyst teams, risk debate). Use for English multi-agent stock research, TradingAgentsGraph, propagate decisions, or porting agent roles to ION DEX AI analysis.
---

# TradingAgents

**仓库**: https://github.com/TauricResearch/TradingAgents  
**定位**: LangGraph 多智能体 LLM 金融研究框架（分析师 → 研究员辩论 → 交易员 → 风控 → 组合经理）。

## 何时使用

- 需要「模拟交易公司」式多角色 LLM 协作（基本面 / 新闻 / 情绪 / 技术）。
- 为 ION DEX「AI 市场分析」设计 agent 编排与辩论流程。
- 英文市场、研究用途；中文/A 股优先用 `trading-agents-cn`。

## 核心架构

- `TradingAgentsGraph` + `DEFAULT_CONFIG` 驱动全流程。
- 角色：Fundamentals / Sentiment / News / Technical analysts → Bull/Bear researchers → Trader → Risk team → Portfolio manager。
- 深度思考 vs 快速思考 LLM 可分开配置（测试建议用小模型省成本）。

## 快速开始

```bash
git clone https://github.com/TauricResearch/TradingAgents.git
cd TradingAgents
pip install -e .
# 配置 OPENAI_API_KEY 等，见仓库 .env.example
```

```python
from tradingagents.graph.trading_graph import TradingAgentsGraph
from tradingagents.default_config import DEFAULT_CONFIG

ta = TradingAgentsGraph(debug=True, config=DEFAULT_CONFIG.copy())
_, decision = ta.propagate("AAPL", "2026-05-27")
print(decision)
```

## 开发要点

- 扩展 agent：在 LangGraph 节点层增加 analyst 或 debate 轮次，保持 `AgentState` 字段一致。
- 换 LLM：改 `config` 中 provider/model；注意 API 调用次数高。
- 接 ION DEX：将 `propagate` 输出映射为 UI 可展示的「观点 + 置信度 + 风险标签」，不要直接下单。

## 限制

- 研究/教育用途；非投资建议。
- 实盘需自建执行层与合规审查。

详见 [references.md](references.md)。
