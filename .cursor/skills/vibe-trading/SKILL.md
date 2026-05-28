---
name: vibe-trading
description: Guides HKUDS Vibe-Trading personal trading agent with natural-language strategy generation, backtests, swarm teams, and vibe-trading-mcp for Cursor. Use for research-only NL trading workflows, MCP tool integration, or ION DEX AI assistant patterns.
---

# Vibe-Trading

**仓库**: https://github.com/HKUDS/Vibe-Trading  
**PyPI**: `vibe-trading-ai`  
**定位**: 自然语言 → 市场研究 / 策略代码 / 回测 / 报告；**不执行实盘**。

## 何时使用

- Cursor/Claude 通过 MCP 做金融研究与回测。
- 多 agent swarm（投资/量化/ crypto / 宏观 / 风控）。
- 导出 TradingView Pine、TDX、MT5 等 artifacts。

## 安装与命令

```bash
pip install vibe-trading-ai
vibe-trading init          # 交互式 .env
vibe-trading               # CLI / TUI
vibe-trading serve --port 8899
vibe-trading-mcp           # MCP stdio 服务
```

## Cursor MCP 配置示例

在 `.cursor/mcp.json`（用户级或项目级）添加：

```json
{
  "mcpServers": {
    "vibe-trading": {
      "command": "vibe-trading-mcp",
      "args": []
    }
  }
}
```

16 个 MCP 工具中多数无需 LLM Key；`run_swarm` 需要 LLM。

## 能力摘要

- 5+ 数据源（A 股/港美/crypto 等，自动 fallback）。
- 7 种回测引擎、Walkforward 式验证、Shadow Account 对比。
- 跨会话 memory 与可编辑 skills。

## ION DEX 集成

- 借鉴 NL → 工具链 → 结构化报告 的 UX，接 ION 行情与链上风险 API。
- 保持「仅分析、不下单」直到钱包/合约层单独审计通过。

详见 [references.md](references.md)。
