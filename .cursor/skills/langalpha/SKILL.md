---
name: langalpha
description: Guides ginlix-ai LangAlpha Claude-Code-style finance agent harness with persistent sandboxes, programmatic tool calling, financial skills, and Docker stack. Use for vibe investing workspaces, DCF/earnings skills, or ION DEX AI research desk UX.
---

# LangAlpha

**仓库**: https://github.com/ginlix-ai/LangAlpha  
**托管**: https://ginlix.ai  
**许可**: Apache-2.0  
**定位**: 金融版 Claude Code — 持久 workspace、沙箱执行、MCP/PTC、Web UI + TradingView。

## 何时使用

- 持久化投研 workspace（非单次 chat）。
- Programmatic Tool Calling：MCP 工具 → 自动生成 Python 模块在沙箱 import。
- 预置 ~23 金融 skills（DCF、财报、晨报等）。
- 价格触发 automation、并行 subagent。

## 技术栈

- Python 3.12+、LangGraph、FastAPI、Postgres、Redis、React 19。
- 沙箱：Daytona 等（可配置）；`make config` 向导生成 `.env`。

## 快速开始

```bash
git clone https://github.com/ginlix-ai/langalpha.git
cd langalpha
make config
make up
# Frontend ~ :8513, API health: curl localhost:8000/health
```

## 开发要点

- **PTC 模式**：避免把原始 MCP JSON 灌满 context；在 sandbox 写 Python 调数据。
- Skills 目录可扩展；与 Cursor Skills 概念类似但是 runtime 内置。
- ION DEX：AI 分析页 = workspace + 图表 + agent 线程 + 链上风险 skill。

## 与 TradingAgents 区别

- TradingAgents：一次性 propagate 决策流水线。
- LangAlpha：长期 compound 研究、代码执行、文件索引。

详见 [references.md](references.md).
