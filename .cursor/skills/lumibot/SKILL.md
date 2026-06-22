---
name: lumibot
description: Guides Lumiwealth Lumibot backtestable trading framework for stocks, options, crypto, futures, and forex with broker integrations and multi-agent LLM strategies. Use when one codebase must run backtest, paper, and live across brokers, or hybrid deterministic + AI agents for ION DEX.
---

# Lumibot

**仓库**: https://github.com/Lumiwealth/lumibot  
**文档**: https://lumibot.lumiwealth.com  
**许可**: GPL-3.0（注意与 ION 产品链接时的许可影响）  
**定位**: 同一策略代码 → 回测 / 纸面 / 实盘；含 AI agent runtime。

## 何时使用

- 多资产（股/期权/crypto/期货/外汇）统一 `Strategy` 类。
- Broker：Alpaca、IB、Tradier、Schwab、Tradovate、Bitunix 等。
- 多 agent LLM 辩论 + 工具调用 + 可选下单。

## 安装

```bash
pip install lumibot
```

## 模式

1. **确定性策略**：`on_trading_iteration`、指标、调度、风控。
2. **AI agent 策略**：证据链、memory、工具、可选 execution。
3. **混合**：规则硬约束 + LLM 软决策。

## 开发要点

```python
from lumibot.strategies import Strategy
from lumibot.backtesting import YahooDataBacktesting

class MyStrategy(Strategy):
    def on_trading_iteration(self):
        # 信号逻辑
        pass
```

- 回测与 live 共用策略类；切换 broker/data source。
- ION DEX：借鉴 lifecycle 与 artifact inspect；链上 DEX 需自定义 broker/execution adapter。
- GPL：避免在未评估前静态链接 Lumibot 进闭源核心。

详见 [references.md](references.md).
