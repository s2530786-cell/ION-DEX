---
name: finrl-trading
description: Guides AI4Finance FinRL-Trading (FinRL-X) modular quant infrastructure with weight-centric strategy pipeline, bt backtesting, and Alpaca live execution. Use for production-oriented quant layering, portfolio weights, or DRL/LLM-ready strategy modules in ION DEX backend design.
---

# FinRL-Trading (FinRL-X)

**仓库**: https://github.com/AI4Finance-Foundation/FinRL-Trading  
**论文**: FinRL-X arXiv:2603.21330  
**前身**: https://github.com/AI4Finance-Foundation/FinRL（教育/ DRL 单体，新项目优先 FinRL-X）

## 何时使用

- 模块化量化：**数据 → 策略 → 回测 → 执行** 四层分离。
- **权重向量**作为策略与执行之间的稳定契约。
- 生产向 paper/live（Alpaca 等）与多账户风控。

## 四层架构

| 层 | 职责 |
|----|------|
| Data | Yahoo / FMP / WRDS 等统一数据 |
| Strategy | 选股、配置、择时、风险 overlay → 目标权重 |
| Backtest | `bt` 引擎、基准、交易成本 |
| Execution | 券商适配、paper/live、风控检查 |

## 与经典 FinRL 对比

- FinRL：Gym + DRL 教程向。
- FinRL-X：AI-native、Pydantic 配置、部署一致性、LLM 信号可插拔。

## 快速开始

```bash
git clone https://github.com/AI4Finance-Foundation/FinRL-Trading.git
cd FinRL-Trading
# 按 README 配置 .env 与 Pydantic settings
```

## ION DEX 集成

- 将「目标权重/信号」映射为 DEX 网格或现货模块的输入，不直接耦合 FunC 合约。
- 回测层输出 Sharpe、MDD、 turnover 供 AI 分析页展示。
- 密钥与 live 开关遵循 `ion-data-backend` + 安全审计。

详见 [references.md](references.md).
