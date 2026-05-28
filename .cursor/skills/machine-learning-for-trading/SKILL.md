---
name: machine-learning-for-trading
description: Guides stefan-jansen machine-learning-for-trading ML4T book code for feature engineering, model training, backtesting, and workflow design. Use when implementing classical ML trading pipelines, alpha factors, or zipline-style research for ION DEX analytics.
---

# Machine Learning for Trading (ML4T)

**仓库**: https://github.com/stefan-jansen/machine-learning-for-trading  
**书籍**: *Machine Learning for Algorithmic Trading* 2nd ed. — https://ml4trading.io

## 何时使用

- 经典 ML 量化：线性模型、树模型、NLP、深度学习、强化学习章节实验。
- 设计 ION DEX 回测/因子/标签流水线（非 LLM agent 路线）。
- 需要与 `zipline-reloaded`、`alphalens-reloaded` 生态对齐时。

## 仓库结构（按章）

| 目录前缀 | 主题 |
|---------|------|
| `01_`–`04_` | ML 基础、数据源、Alpha 因子 |
| `05_`–`07_` | 线性/树/Boosting 策略 |
| `08_ml4t_workflow` | **ML → 策略回测工作流（重点）** |
| `09_`–`24_` | NLP、深度学习、RL、合成数据等 |

## 环境

- 各章独立 `requirements` / conda；优先按 README 安装对应章节环境。
- 数据下载脚本在章节目录内；失败时查 GitHub Issues。

## 开发要点

- 工作流：`特征 → 标签 → 训练/验证 → 信号 → 组合回测 → 成本/滑点敏感性`。
- 接 ION DEX：将 notebook 中的信号生成抽象为 backend job + 缓存表，UI 只读指标与 stale 状态（见 `ion-data-backend`）。
- 不要整本 notebook 搬进生产路径；只移植验证过的模块。

## 关联项目

- https://github.com/stefan-jansen/zipline-reloaded  
- https://github.com/stefan-jansen/alphalens-reloaded  

详见 [references.md](references.md)。
