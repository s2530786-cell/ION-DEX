# E2B 沙箱 + Docker MCP Catalog 快速入门

官方文档：[Docker — E2B sandboxes](https://docs.docker.com/ai/mcp-catalog-and-toolkit/e2b-sandboxes/) · [E2B MCP](https://e2b.dev/docs/mcp)

## 这是什么

| 组件 | 作用 |
|------|------|
| **E2B** | 云端隔离 Linux 沙箱，供 AI Agent 安全执行命令 |
| **Docker MCP Catalog** | 200+ 预配置 MCP（Notion、GitHub、Stripe 等） |
| **MCP Gateway** | 沙箱内统一入口；Agent 通过 HTTP + Bearer 访问 |

与 **Cursor 本地 Notion MCP** 的区别：Cursor 插件在本机连 Notion；E2B 在**远程沙箱**里启动 MCP，适合自动化流水线、Claude Code 批任务、不可信工具隔离。

## 本仓库模板

路径：`tools/mcp-e2b-quickstart/`

```powershell
cd D:\openclaw-tools\ion-dex-nuke\tools\mcp-e2b-quickstart
copy .env.example .env
# 编辑 .env：E2B_API_KEY、ANTHROPIC_API_KEY、NOTION_INTEGRATION_TOKEN、GITHUB_TOKEN
npm install
npm start              # 仅验证沙箱 + Claude 连接 MCP
npm run workflow       # Notion 搜索 + 在 GITHUB_TEST_REPO 建 Issue
```

## 前置条件

1. [E2B](https://e2b.dev) 账号与 API Key  
2. [Anthropic](https://console.anthropic.com/) API Key（沙箱内预装 Claude Code）  
3. Notion：集成 Token，且数据库已授权给该集成  
4. GitHub：PAT（`repo` 等所需 scope），`GITHUB_TEST_REPO=owner/repo`

## 与 OpenClaw / Cursor 的关系

- **Cursor**：可在设置里添加 MCP；不必经过 E2B，除非你要云端隔离。  
- **OpenClaw**：若要把沙箱内 MCP 给网关用，需把 `sbx.getMcpUrl()` + `getMcpToken()` 配成 HTTP MCP（类似文档里的 `claude mcp add --transport http`）。  
- **ION DEX 项目**：本模板独立，不修改 frontend/backend；仅作 Agent 工具链实验。

## 常见问题

| 现象 | 处理 |
|------|------|
| `Missing E2B_API_KEY` | 复制 `.env.example` → `.env` 并填写 |
| MCP 连接超时 | 将等待时间从 3s 增至 5–10s |
| GitHub Issue 失败 | 检查 `GITHUB_TEST_REPO` 与 PAT scope |
| Notion 无数据 | 在 Notion 集成设置里勾选目标页面/数据库 |

## 安全

- 勿将 `.env` 提交 Git  
- PAT / Notion Token 仅用于测试仓库与测试库
