# Docker Compose for Agents — 本机安装指南

官方仓库：[docker/compose-for-agents](https://github.com/docker/compose-for-agents)

这是一组 **Docker Compose 示例**，用不同 Agent 框架（CrewAI、LangGraph、ADK、Agno 等）编排本地/云端模型与 MCP，**不是**单个 npm 包。「安装所有能力」= 克隆仓库 + 外部子项目 + 密钥模板 +（可选）拉取模型与构建镜像。

---

## 前置条件（你当前环境）

| 项 | 要求 | 你机器 |
|----|------|--------|
| Docker Desktop | 4.43+ | 29.4.x ✓ |
| Docker Compose | 2.38+ | v5.1.4 ✓ |
| Docker Model Runner | 本地 `ai/qwen3` 等 | v1.1.x ✓ |
| GPU | 推荐；无 GPU 用 `compose.openai.yaml` 或 Docker Offload | Windows 需确认 Desktop 里已开 GPU |
| MCP Toolkit | 部分 Demo 要 GitHub/Brave 等密钥 | 见 [docker-mcp-gateway-local.md](docker-mcp-gateway-local.md) |

---

## 一键准备（推荐）

在仓库根目录 PowerShell：

```powershell
& "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "D:\openclaw-tools\ion-dex-nuke\scripts\setup-compose-for-agents.ps1"
```

可选参数：

| 参数 | 作用 |
|------|------|
| `-PullModels` | 预拉 `ai/qwen3`、`ai/gemma3` 等（体积大，需 GPU/磁盘） |
| `-BuildAll` | 对所有内置 Demo 执行 `docker compose build`（耗时长） |
| `-ExportMcpSecrets` | 从 Docker Desktop MCP 导出密钥到 `.mcp.env` |
| `-OpenAiKeyFile "C:\path\to\key.txt"` | 单行 `sk-...` 复制到各 Demo 的 `secret.openai-api-key` |

安装位置：

- 主仓库：`tools/compose-for-agents/`
- 外部 Demo：`tools/compose-for-agents-external/`（Vercel UI、Embabel Tripper、MinionS）
- 日志与临时文件（脚本默认）：`D:\Docker\ion-dex\logs`、`D:\Docker\ion-dex\temp`

### 不要把镜像/模型撑在 C 盘

Docker Desktop 的镜像、构建缓存和 Model Runner 模型都写在 WSL 虚拟盘 `docker_data.vhdx` 里。默认路径在 C 盘（约数十 GB）。**仅把 `TEMP` 设到 D 盘无法避免 C 盘增长。**

推荐：用目录联接把数据迁到 D 盘（需**管理员** + **完全退出 Docker Desktop**）：

```powershell
# 以管理员打开 PowerShell，确认 Docker 已退出后：
& "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "D:\openclaw-tools\ion-dex-nuke\scripts\migrate-docker-wsl-junction-to-d.ps1" -Force
```

目标目录：`D:\Docker\wsl`（含 `disk\docker_data.vhdx`）。完成后重新打开 Docker Desktop。

后台拉取全部模型并构建所有镜像（迁移完成后）：

```powershell
& "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "D:\openclaw-tools\ion-dex-nuke\scripts\run-compose-agents-pull-build-background.ps1"
```

日志：`D:\Docker\ion-dex\logs\pull-build-*.log`

若未迁移就执行 `-PullModels -BuildAll`，`setup-compose-for-agents.ps1` 会**拒绝运行**（除非加 `-SkipDriveCheck`）。

迁移后若 Docker 报找不到 `wsl` 路径，仅补联接（数据已在 `D:\Docker\wsl` 时）：

```powershell
& "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File "D:\openclaw-tools\ion-dex-nuke\scripts\fix-docker-wsl-junction-only.ps1"
```

然后**重新打开 Docker Desktop**，再跑后台拉取脚本（加 `-SkipMigration` 跳过已完成的迁移）。

---

## 13 个 Demo 一览

### 仓库内（10 个，可直接 `compose up`）

| Demo | 框架 | 典型 UI | MCP / 密钥 |
|------|------|---------|------------|
| `a2a` | Agent2Agent | :8080 | `secret.openai-api-key` |
| `agno` | Agno | :3000 / :7777 | `.mcp.env`（GitHub PAT） |
| `adk` | Google ADK | :8080 | 本地 gemma3 |
| `adk-cerebras` | ADK + Cerebras | :8000 | `CEREBRAS_API_KEY` |
| `adk-sock-shop` | ADK 电商 | — | `.mcp.env`（Brave/Mongo 等） |
| `akka` | Akka SDK | — | `secret.openai-api-key` |
| `crew-ai` | CrewAI | :8080 | 本地 qwen3 |
| `langgraph` | LangGraph SQL | — | Postgres + qwen3 |
| `langchaingo` | LangChain Go | :8080 | duckduckgo MCP |
| `spring-ai` | Spring AI | :8080 | duckduckgo |

### 需额外克隆（3 个，脚本已处理）

| Demo | 路径 | 说明 |
|------|------|------|
| `vercel` | `tools/compose-for-agents-external/scira-mcp-chat` | Vercel AI SDK + MCP Chat |
| `embabel` | `tools/compose-for-agents-external/tripper` | Embabel 旅行规划 |
| `minions` | `.../minions/apps/minions-docker` | MinionS 本地+云端协作，需 `OPENAI_API_KEY` |

清单 JSON：`tools/compose-for-agents/demos.manifest.json`

---

## 启动单个 Demo

```powershell
# 本地模型（默认 compose.yaml）
& "...\scripts\compose-agents-up.ps1" -Demo agno

# 无 GPU：改用 OpenAI 叠加文件（需 secret.openai-api-key）
& "...\scripts\compose-agents-up.ps1" -Demo crew-ai -OpenAI

# 后台
& "...\scripts\compose-agents-up.ps1" -Demo a2a -Detach
```

**不要同时启动全部 Demo**（端口/GPU/内存会冲突）。一次只跑一个。

---

## 密钥配置

### OpenAI（a2a / akka 等）

在对应目录创建 `secret.openai-api-key`（仅一行 `sk-...`），或：

```powershell
docker compose -f compose.yaml -f compose.openai.yaml up --build
```

### MCP（agno / adk-sock-shop / vercel / embabel）

```powershell
# 在 Docker Desktop MCP Toolkit 配置后导出
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" mcp secret set "github.personal_access_token=ghp_..."
& "C:\Program Files\Docker\Docker\resources\bin\docker.exe" mcp secret export github-official > tools\compose-for-agents\agno\.mcp.env
```

参考 `agno/.mcp.env.example`、`adk-sock-shop/.mcp.env.example`。

### Cerebras（adk-cerebras）

在 `adk-cerebras` 目录配置 `.env` 或 compose 中的 `CEREBRAS_API_KEY`（见该目录 README）。

---

## 与 ION DEX 现有栈的关系

| 组件 | 关系 |
|------|------|
| **Hermes MCP** | Cursor 侧 Agent，与 Compose Demo 独立 |
| **MCP_DOCKER / dev_workflow** | Cursor 用 Catalog MCP；Compose Demo 自建 `mcp-gateway` 容器 |
| **OpenClaw** | 可共用远域云/OpenAI 密钥；Compose Demo 不替代 OpenClaw |

---

## 故障排查

1. **`docker` 找不到** — 使用 `C:\Program Files\Docker\Docker\resources\bin\docker.exe` 全路径（与 `mcp.json` 相同）。
2. **模型拉取失败** — 无 GPU 时用 `-OpenAI` 或 `compose.offload.yaml`（`compose-agents-up.ps1 -Offload`）。
3. **端口占用** — 改 compose 端口或 `docker compose down` 停掉其它 Demo。
4. **`.mcp.env` 为空** — 运行 `setup-compose-for-agents.ps1 -ExportMcpSecrets` 或手动填写。

---

## 参考链接

- [Compose for Agents README](https://github.com/docker/compose-for-agents/blob/main/README.md)
- [Docker Model Runner](https://docs.docker.com/ai/model-runner/)
- [Docker Offload](https://www.docker.com/products/docker-offload/)
