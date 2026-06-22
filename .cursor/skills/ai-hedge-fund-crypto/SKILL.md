---
name: ai-hedge-fund-crypto
description: Guides 51bitquant ai-hedge-fund-crypto LangGraph DAG workflow with multi-timeframe technical ensemble and LLM portfolio decisions for cryptocurrency. Use for crypto-specific agent graphs, strategy ensembling, or ION DEX AI trading research modules.
---

# AI Hedge Fund Crypto

**仓库**: https://github.com/51bitquant/ai-hedge-fund-crypto  
**许可**: MIT  
**定位**: LangGraph DAG + 多时间框架技术 ensemble + LLM 组合/风控决策（crypto）。

## 何时使用

- 加密算法交易 graph pipeline（非股票 virattt/ai-hedge-fund）。
- 多策略 `BaseNode` 并行 → 加权 ensemble → LLM 仓位管理。
- ION DEX 链上/CEX 混合信号研究（需自建数据源）。

## 架构

```
Market Data → [Strategy Nodes × N timeframes] → Signal Ensemble → Risk → LLM Decision → Portfolio
```

- 每个策略节点实现 `BaseNode`，处理多 interval、多资产。
- LangGraph 编排 DAG；LLM 做高层仓位与风险叙述。

## 快速开始

```bash
git clone https://github.com/51bitquant/ai-hedge-fund-crypto.git
cd ai-hedge-fund-crypto
pip install -r requirements.txt
# 配置 OpenAI 等；见 README 运行 graph
```

## 开发要点

- 扩展策略：新增 Node + 注册到 graph + ensemble 权重。
- 数据：按仓库 adapter 接 exchange/OHLCV；ION 需自定义 feed。
- 与 `trading-agents` 对比：本仓库偏 **量化节点 + LLM 决策**，非全角色辩论戏剧。

## 限制

- 研究/实验；实盘需审计滑点、杠杆、密钥与合规。

详见 [references.md](references.md).
