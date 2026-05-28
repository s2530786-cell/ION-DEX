---
name: tensortrade
description: Guides TensorTrade and TensorTrade-NG reinforcement-learning trading environments with composable ActionScheme, RewardScheme, and Stable-Baselines3 integration. Use when building RL trading agents, custom gym environments, or crypto strategy RL research for ION DEX.
---

# TensorTrade

**主仓**: https://github.com/tensortrade-org/tensortrade  
**维护 fork**: https://github.com/erhardtconsulting/tensortrade-ng（文档 https://tensortrade-ng.io/）  
**定位**: 可组合 RL 交易环境（非完整 broker）。

## 何时使用

- 训练 PPO/SAC 等 RL agent 做买卖持有决策。
- 自定义 observation / reward / action scheme。
- 新开发优先评估 **TensorTrade-NG**（API 清理、Gymnasium、SB3）。

## 核心组件

| 组件 | 作用 |
|------|------|
| `ActionScheme` | agent 输出 → 订单（默认 BSH） |
| `RewardScheme` | 学习信号（如 PBR） |
| `Observer` | 窗口化特征 |
| `Portfolio` | 钱包与持仓 |
| `Exchange` | 撮合与手续费模拟 |

## 快速开始（概念）

```python
# 见官方 docs：创建 TradingEnvironment + Stable-Baselines3 PPO
from stable_baselines3 import PPO
model = PPO("MlpPolicy", env, verbose=1)
model.learn(10_000)
```

## 开发要点

- 手续费与交易频率是 RL 盈利关键；见仓库 `EXPERIMENTS.md`。
- 接 ION DEX：RL 输出「目标权重/信号」，执行层单独模拟滑点与 gas。
- 原版 tensortrade 维护较弱；生产研究用 NG fork。

## 限制

- 研究框架；实盘需独立风控与执行系统。

详见 [references.md](references.md).
