---
name: octobot
description: Guides Drakkar-Software OctoBot open-source crypto trading bot with grid, DCA, AI connectors, TradingView signals, backtesting, and 15+ exchange integrations. Use for ION DEX grid strategy UX, bot automation patterns, or Hyperliquid/Binance-style bot design.
---

# OctoBot

**仓库**: https://github.com/Drakkar-Software/OctoBot  
**文档**: https://github.com/Drakkar-Software/OctoBot-Docs  
**许可**: GPL-3.0  
**定位**: 开源加密交易机器人 + Web UI（网格、DCA、AI、TradingView）。

## 何时使用

- ION DEX「网格策略 / DCA / 自动化」产品参考。
- 多交易所（含 Hyperliquid 等）机器人架构。
- 回测与 strategy optimizer 工作流。

## 安装

```bash
# Docker / 可执行文件 / Python 源码 — 见 octobot.cloud 安装指南
pip install octobot   # Python 3.12+
```

## 能力

- 内置：网格、DCA、AI（OpenAI/Ollama 等 connector）、TradingView webhook。
- 回测：历史数据回放；Strategy Optimizer 多参数对比。
- UI：配置 profile、交易模式、评估器（evaluators）。

## 开发要点

- 策略扩展：OctoBot Tentacles / trading modes / evaluators 插件体系（读 Docs）。
- GPL-3.0：若链接/修改 OctoBot 代码进 ION 产品，需合规评估；通常仅借鉴架构与 UX。
- 接 ION 链：需自建 exchange connector，勿假设 Binance API 可直接映射。

## ION DEX 映射

- 网格 UI：参考 OctoBot profile + 参数面板 + 回测结果页。
- 风险：纸面/模拟开关、交易所 API 权限最小化。

详见 [references.md](references.md).
