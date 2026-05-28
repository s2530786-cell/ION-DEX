---
name: quantdinger
description: Guides QuantDinger self-hosted AI quant platform with Docker, Python strategies, backtest, live trading, and quantdinger-mcp for Cursor. Use for full-stack quant OS design, IndicatorStrategy/ScriptStrategy, or agent API integration with ION DEX.
---

# QuantDinger

**仓库**: https://github.com/brokermr810/QuantDinger  
**PyPI MCP**: `quantdinger-mcp`  
**定位**: 自托管量化 OS — 图表、AI 研究、Python 策略、回测、实盘（crypto / IBKR / MT5 / Alpaca）。

## 何时使用

- 需要 Docker Compose 一站式量化栈（Flask + Postgres + Redis + Vue）。
- Cursor Agent 通过 MCP 读行情、跑回测、管理策略。
- ION DEX 网格/策略/回测产品形态参考。

## 部署

```bash
git clone https://github.com/brokermr810/QuantDinger.git
cd QuantDinger
cp .env.example .env   # 编辑密钥与端口
docker compose up -d
```

## 策略类型

- `IndicatorStrategy` — 指标驱动。
- `ScriptStrategy` — 事件驱动 Python 脚本。

## Cursor MCP

```bash
uvx quantdinger-mcp
# 或 pip install quantdinger-mcp
```

`.cursor/mcp.json` 示例（自托管）：

```json
{
  "mcpServers": {
    "quantdinger": {
      "command": "uvx",
      "args": ["quantdinger-mcp"],
      "env": {
        "QUANTDINGER_BASE_URL": "http://127.0.0.1:YOUR_PORT",
        "QUANTDINGER_API_TOKEN": "YOUR_TOKEN"
      }
    }
  }
}
```

托管试用：`QUANTDINGER_BASE_URL` 指向官方 hosted（纸面 only）。

## Agent API

- REST `/api/agent/v1`：token、限流、审计、幂等、SSE 任务流。
- 与 ION DEX backend 设计对齐：scoped token + 只读/回测/纸面分级。

## 安全

- 密钥仅在 `.env` / 密钥管理器；live trading 需显式 kill switch。
- Apache 2.0；商用前读仓库许可说明。

详见 [references.md](references.md)。
