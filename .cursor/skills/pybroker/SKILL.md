---
name: pybroker
description: Guides PyBroker ML algorithmic trading framework with Numba-accelerated backtesting, walkforward analysis, and model-driven signals. Use when building ML prediction strategies, walkforward validation, or research pipelines for ION DEX analytics.
---

# PyBroker

**仓库**: https://github.com/edtechre/pybroker  
**文档**: https://www.pybroker.com  
**定位**: Python ML 算法交易 — 训练、Walkforward、回测一体。

## 何时使用

- 特征 → 模型 → 信号 → 回测 的 ML 主线。
- Walkforward 分析防过拟合。
- Numba 加速的大规模 bar 级回测。

## 安装

```bash
pip install lib-pybroker
# 或 clone 仓库开发
git clone https://github.com/edtechre/pybroker.git
```

## 核心概念

- **Strategy** + rules：多标的规则与模型打分。
- **Walkforward Analysis**：滚动训练/测试，贴近实盘。
- 数据：Yahoo 等源（见文档）；crypto 需确认数据适配。

## 开发要点

- 先定义标签与泄漏防护，再调模型；Walkforward 结果写入可审计 artifact。
- ION DEX：backend 定时跑 walkforward job，前端展示 OOS 指标与 `last_updated`。
- 与 ML4T 互补：ML4T 偏教材全景，PyBroker 偏 ML 生产化研究 API。

## 限制

- 非 LLM agent 框架；与 TradingAgents 分工明确。

详见 [references.md](references.md).
