---
name: quant-trading-frameworks
description: Routes ION DEX quant tasks to private Skills in ion-private-core (Kronos, TradingAgents, QuantDinger, etc.). Public stub only — load full skills from d:\openclaw-tools\ion-private-core\.cursor\skills or .cursor/skills-private junction.
---

# 量化 / AI 交易框架路由（公开仓存根）

**机密 Skills 在闭源仓** `ion-private-core`，勿把 `kronos`、`money-printer-turbo` 等完整 Skill 推送到本公开仓库。

本地启用：

```powershell
d:\openclaw-tools\ion-private-core\scripts\link-skills-to-ion-dex.ps1
```

然后加载 `d:\openclaw-tools\ion-private-core\.cursor\skills\quant-trading-frameworks\SKILL.md` 或 `.cursor\skills-private\quant-trading-frameworks\SKILL.md`。

**K 线预测** → 私有 Skill `kronos`（[shiyu-coder/Kronos](https://github.com/shiyu-coder/Kronos)）。

在 ION DEX 或独立量化任务中，先读私有路由 Skill 选框架，再加载对应子 Skill。

## 安全与边界

- 这些框架默认用于**研究、回测、纸面交易**；不得在未授权情况下连接主网实盘或用户资金。
- 不得把 Skill 中的示例 API Key、交易所凭证写入仓库；只用环境变量。
- ION DEX 产品 UI 仍遵循 `ion-web3-ui`；链上执行仍遵循 `ion-contract-audit` 与 `ion-data-backend`。

## 选型矩阵

| 需求 | 优先 Skill | 备选 |
|------|-----------|------|
| 多智能体 LLM 投研（英文原版） | `trading-agents` | `langalpha` |
| 多智能体 LLM + A 股/中文/国产模型 | `trading-agents-cn` | `vibe-trading` |
| ML 教材 + 经典 ML4T 工作流 | `machine-learning-for-trading` | `pybroker` |
| 自然语言 → 策略 + MCP（Cursor 友好） | `vibe-trading` | `quantdinger` |
| 自托管全栈量化 OS + MCP | `quantdinger` | `octobot` |
| 强化学习交易环境 | `tensortrade` | `finrl-trading` |
| 开源加密机器人（网格/DCA/TradingView） | `octobot` | `quantdinger` |
| ML 策略 + Walkforward 验证 | `pybroker` | `machine-learning-for-trading` |
| 生产向模块化量化基础设施（FinRL-X） | `finrl-trading` | `pybroker` |
| 同一策略回测 + 多券商实盘 | `lumibot` | `quantdinger` |
| 持久化金融研究 Workspace（Claude Code 风格） | `langalpha` | `trading-agents` |
| LangGraph + 加密多策略 ensemble + LLM | `ai-hedge-fund-crypto` | `trading-agents` |

## ION DEX 常见映射

| PRD 能力 | 参考框架模式 |
|----------|-------------|
| AI 市场分析 | TradingAgents / LangAlpha / Vibe-Trading 多智能体辩论 |
| 网格 / DCA | OctoBot、QuantDinger 策略模块 |
| 专业现货 / 限价 | Lumibot、QuantDinger 事件驱动策略 |
| 回测与指标 | PyBroker、ML4T、FinRL-Trading |
| Cursor 自动化研究 | Vibe-Trading MCP、QuantDinger MCP |

## 子 Skill 索引

| Skill 目录 | 上游仓库 |
|-----------|---------|
| `.cursor/skills/trading-agents/` | https://github.com/TauricResearch/TradingAgents |
| `.cursor/skills/trading-agents-cn/` | https://github.com/hsliuping/TradingAgents-CN |
| `.cursor/skills/machine-learning-for-trading/` | https://github.com/stefan-jansen/machine-learning-for-trading |
| `.cursor/skills/vibe-trading/` | https://github.com/HKUDS/Vibe-Trading |
| `.cursor/skills/quantdinger/` | https://github.com/brokermr810/QuantDinger |
| `.cursor/skills/tensortrade/` | https://github.com/tensortrade-org/tensortrade |
| `.cursor/skills/octobot/` | https://github.com/Drakkar-Software/OctoBot |
| `.cursor/skills/pybroker/` | https://github.com/edtechre/pybroker |
| `.cursor/skills/finrl-trading/` | https://github.com/AI4Finance-Foundation/FinRL-Trading |
| `.cursor/skills/lumibot/` | https://github.com/Lumiwealth/lumibot |
| `.cursor/skills/langalpha/` | https://github.com/ginlix-ai/LangAlpha |
| `.cursor/skills/ai-hedge-fund-crypto/` | https://github.com/51bitquant/ai-hedge-fund-crypto |

## 工作流

1. 明确任务：研究 / 回测 / 纸面 / 实盘 / UI 集成 / MCP。
2. 用上表选 1 个主 Skill + 最多 1 个备选。
3. 读取该 Skill 的 `SKILL.md`；需要安装细节时再读 `references.md`。
4. 在 ION DEX 仓库内只做**集成与借鉴**（API 形状、agent 编排、回测指标），不要整库拷贝进 `frontend/` 或 `backend/` 除非用户明确要求 vendor。
5. 改代码后按项目规则跑验证；量化实验在独立 venv/容器中进行。
