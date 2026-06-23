---
name: trading-agents-cn
description: Guides TradingAgents-CN Chinese-enhanced multi-agent LLM trading framework with A-share/HK/US support, domestic LLMs, Docker, and Web UI. Use for Chinese financial research, A-share data, or localizing TradingAgents patterns for ION DEX.
---

# TradingAgents-CN

**仓库**: https://github.com/hsliuping/TradingAgents-CN  
**上游**: https://github.com/TauricResearch/TradingAgents  
**定位**: 中文增强版多智能体 LLM 股票分析学习平台（Web 界面、国产模型、A 股/港股/美股、Docker）。

## 何时使用

- 中文用户投研、国产大模型（通义/DeepSeek/智谱等）。
- A 股/港股数据与中文报告导出。
- ION DEX 中文 AI 分析模块的产品与文案参考。

## 相比原版增强

- 中文 UI、智能新闻过滤、多 LLM 提供商、模型选择持久化。
- Docker 一键部署、专业报告导出、统一日志。
- v1.0.1+ 稳定线；商业使用需单独授权（见仓库 LICENSE）。

## 快速开始

```bash
git clone https://github.com/hsliuping/TradingAgents-CN.git
cd TradingAgents-CN
# 按 docs/ 与 docker-compose 启动；配置 .env 与国内模型 Key
```

## 开发要点

- 配置走 Web 配置界面或 `docs/` 中文文档。
- 批量分析、运营版等为社区 fork；默认以 hsliuping 主仓为准。
- 集成 ION DEX：复用「多分析师 + 辩论 + 风控」状态机，数据源换为 ION/CMC/链上指标 API。

## 限制

- 平台定位为学习与研究，不提供实盘交易指令。
- 勿将商业授权版功能假设为 Apache 默认可用。

详见 [references.md](references.md)。
