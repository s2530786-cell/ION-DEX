# 量化框架 — 克隆与文档链接

| 框架 | Clone | 文档 / 站点 |
|------|-------|-------------|
| TradingAgents | `git clone https://github.com/TauricResearch/TradingAgents.git` | https://tradingagents-ai.github.io/ |
| TradingAgents-CN | `git clone https://github.com/hsliuping/TradingAgents-CN.git` | 仓库 `docs/` |
| ML4T | `git clone https://github.com/stefan-jansen/machine-learning-for-trading.git` | https://ml4trading.io |
| Vibe-Trading | `git clone https://github.com/HKUDS/Vibe-Trading.git` | 仓库 README；PyPI `vibe-trading-ai` |
| QuantDinger | `git clone https://github.com/brokermr810/QuantDinger.git` | https://www.quantdinger.com |
| TensorTrade | `git clone https://github.com/tensortrade-org/tensortrade.git` | https://www.tensortrade.org/ |
| TensorTrade-NG | `git clone https://github.com/erhardtconsulting/tensortrade-ng.git` | https://tensortrade-ng.io/ |
| OctoBot | `git clone https://github.com/Drakkar-Software/OctoBot.git` | https://www.octobot.cloud |
| PyBroker | `git clone https://github.com/edtechre/pybroker.git` | https://www.pybroker.com |
| FinRL-Trading | `git clone https://github.com/AI4Finance-Foundation/FinRL-Trading.git` | README + arXiv:2603.21330 |
| Lumibot | `git clone https://github.com/Lumiwealth/lumibot.git` | https://lumibot.lumiwealth.com |
| LangAlpha | `git clone https://github.com/ginlix-ai/langalpha.git` | https://ginlix.ai |
| ai-hedge-fund-crypto | `git clone https://github.com/51bitquant/ai-hedge-fund-crypto.git` | 仓库 README |

## 建议隔离方式

- 在仓库外目录克隆（如 `../vendor-quant/`），避免污染 ION DEX 主树。
- 每个框架独立 Python 3.10+ venv；勿与 `frontend/node_modules` 混用。
- MCP 服务（Vibe-Trading、QuantDinger）在 Cursor 用户设置或项目 `.cursor/mcp.json` 配置，密钥不进 Git。

## 相关（未单独建 Skill）

- https://github.com/virattt/ai-hedge-fund — 股票向 AI 对冲基金 POC，与 crypto 版不同。
- https://github.com/AI4Finance-Foundation/FinRL — 经典 FinRL 教程仓。
