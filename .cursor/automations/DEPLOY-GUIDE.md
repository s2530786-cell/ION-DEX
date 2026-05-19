# Cursor Automation 部署指南 — ION DEX

> 仓库内定义文件：`.cursor/automations/ion-dex-autonomous-build.yml`  
> 官方文档：[Automations 帮助](https://cursor.com/help/ai-features/automations) · [Cloud Agent 配置](https://cursor.com/docs/cloud-agent/setup.md)

## 重要说明（2026-05）

- **Cursor 目前没有公开的「上传 YAML 一键导入」API/CLI。** 自动化在浏览器里创建：[cursor.com/automations/new](https://cursor.com/automations/new)。
- 本仓库 YAML 是**提示词与触发器的单一事实来源**；部署时请在 UI 中**手工对照复制** `instructions` 全文（或从 GitHub 打开该文件复制）。
- 定时/Slack 等触发器必须在 UI 里**显式选择仓库与分支**（Cursor 无法从 PR 推断）。
- Cloud Agent 运行在 **Ubuntu 沙箱**，不是本机 `D:\`。路径、Foundry、Node 需在 [Cloud Agents 环境](https://cursor.com/dashboard/cloud-agents#environments) 中配置。

---

## 自动化能力摘要

| 项 | 说明 |
|----|------|
| 触发 | 默认每 30 分钟（cron `*/30 * * * *`），可在 UI 改为 GitHub Push 等 |
| 任务 | 读 `.memory-bank/architecture-audit.md` → 实现下一项 P0 → forge 编译/测试 → 审计 → 绿则 commit |
| 安全 | 合约改动须 `forge test --match-contract SecurityAttackTest`，1500 绿底线（见铁律） |
| 计费 | 按所选模型的 [Cloud Agent API 定价](https://cursor.com/docs/models-and-pricing.md#model-pricing) 计费 |

---

## 仅 Master 可在浏览器完成的步骤（逐步点击）

### 0. 前置条件

1. Cursor 账号已登录，且已连接 **GitHub**（[Integrations](https://cursor.com/dashboard)）。
2. 仓库 **`s2530786-cell/ION-DEX`**（ion-dex-nuke 的 GitHub remote）对 Cursor 有读/写权限（开 PR 需写权限）。不要选错为 `ice-blockchain/ion`（那是官方 ION 节点参考库，不是本 DEX 工程）。
3. 分支 **`2026-05-19-q7fx`** 已 push 且包含 `.cursor/automations/ion-dex-autonomous-build.yml`。
4. 仓库已包含 **`.cursor/environment.json`**（Foundry + npm + Playwright + `compile-func`）。在自动化 UI 中 **Environment → Enabled**，并确认 Cloud Agents 使用该仓库环境。

### 1. 打开创建页

1. 浏览器访问：**https://cursor.com/automations/new**（中文站：**https://cursor.com/cn/automations** → 「新建」/「New automation」）。
2. 若提示连接 GitHub，按向导完成授权。

### 2. 基本信息

1. **名称**：粘贴 `ION DEX Autonomous Build Pipeline`（与 YAML `name` 一致）。
2. **描述**（可选）：`24/7 autonomous ION DEX construction — read build order, execute next task, test, commit, repeat`。
3. **权限**：团队用选 **Team Visible** 或 **Private**；需团队服务账号统一跑选 **Team Owned**（见[权限说明](https://cursor.com/docs/cloud-agent/automations.md#permissions)）。

### 3. 触发器（Trigger）

1. 点击 **Add trigger** → 选 **Scheduled / 定时**。
2. 选 **Custom cron** 或「每 30 分钟」预设；cron 填：**`*/30 * * * *`**（UTC，可能略有延迟，属正常）。
3. **Repository**：选 **`ion-dex-nuke`** 对应 GitHub 仓库（显示名以你连接的 repo 为准）。
4. **Branch**：填 **`2026-05-19-q7fx`**（与当前开发分支一致）。
5. （可选）再添加 **GitHub → Push to branch**，分支同样填 `2026-05-19-q7fx`，用于 push 后立即跑一轮。

> 官方不支持「从本机 YAML 文件导入触发器」；以上需在 UI 逐项点选。

### 4. 提示词（Instructions / Prompt）

1. 在本地或 GitHub 打开：`.cursor/automations/ion-dex-autonomous-build.yml`。
2. 复制 **`instructions: |` 下方整段**（从 `You are the ION DEX...` 到 `铁律 ⑥` 结束），粘贴到自动化编辑器的 **Instructions / Prompt** 大文本框。
3. 保存前确认文中路径为 **仓库根相对路径**（`SESSION_STATE.md`、`.memory-bank/...`），不要保留 Windows `D:\`（云沙箱无效）。

### 5. 工具（Tools）

在 **Tools** 区域勾选（名称以 UI 英文为准，与 YAML `mcps` 对应）：

| 建议勾选 | 用途 |
|----------|------|
| **Open pull request** | 改代码并开 PR（私有自动化以你的 GitHub 身份；Team Owned 以 `cursor` bot） |
| **MCP server** | 外接工具；在 MCP 列表中启用 **GitHub**（若已配置） |
| **Memories** | 可选；跨次运行记笔记（处理不可信输入时慎用） |

**Memory Bank MCP**（项目 `.cursor/mcp.json` 里的 `ion-dex-memory-bank`）需在 [Cursor MCP 设置](https://cursor.com/dashboard) 对 **Cloud Agents / Automations** 同样启用；否则自动化只能读仓库内 `.memory-bank/*.md` 文件，不能调 MCP。

未在 UI 列出的「github」「memory-bank」字符串不会自动生效——必须在 MCP 面板里连接对应服务器。

### 6. 模型（Model）

1. 在 **Model** 下拉选择自主模型，推荐与 YAML 一致：**Claude Sonnet 4.6**（或当前列表中的 **Claude Sonnet 4** / 高自主 **Composer** 档）。
2. YAML 中 `model: claude-sonnet-4-6` 仅作文档；**以 UI 实际选择为准**。

### 7. 环境（Environment）

1. 展开 **Environment** → 选 **Enabled**（需要 `forge` / `npm` / 测试）。
2. 点击链接进入 [Cloud Agents dashboard](https://cursor.com/dashboard/cloud-agents#environments)：
   - **Repository**：选同一 GitHub 仓库。
   - **Install / update command**（示例，按 monorepo 调整）：
     ```bash
     cd frontend && npm ci && cd .. && npm ci && curl -L https://foundry.paradigm.xyz | bash && source ~/.bashrc && foundryup
     ```
   - 或提交仓库级 `.cursor/environment.json`（见[官方 schema](https://www.cursor.com/schemas/environment.schema.json)）。

### 8. 密钥与环境变量（Secrets）

在 **Dashboard → Cloud Agents → Secrets** 添加（名称自定，下列为建议）：

| Secret 名 | 说明 |
|-----------|------|
| `GITHUB_TOKEN` | 仅当 MCP/脚本需要超出默认 GitHub App 权限时 |
| `CURSOR_API_KEY` | 仅用于「方式 2」Webhook 从 GitHub Actions 触发（见下） |
| `ION_VERIFY_NONINTERACTIVE` | 设为 `1` 若自动化要跑 `scripts/agent-verify.cmd` 的 Linux 等价脚本 |

**不要**把 `.env`、私钥、主网 RPC 写入仓库；自动化铁律禁止改 `.env`。

### 9. 保存并激活

1. 点击 **Save** / **Create**。
2. 将开关设为 **Active / Enabled**。
3. 若创建了 **Webhook** 触发器：保存后复制 **Webhook URL** 与 **API Key**（仅保存后可见）。

### 10. 验证自动化已生效

1. 在 [cursor.com/automations](https://cursor.com/automations) 列表中看到该自动化，状态为 **Active**。
2. 点击 **Run now** / **Test run**（若有）手动触发一轮。
3. 打开 **Runs** 历史：应出现 Cloud Agent 运行记录；首跑可能 5–15 分钟（install + clone）。
4. 成功标志：日志中出现读取 `architecture-audit.md`、执行 `forge build` / `forge test`、或打开 PR。
5. 失败时：检查 Environment install 日志、分支名、GitHub 权限、Secrets。

---

## 方式 2：GitHub Actions 触发 Webhook（可选）

当需要在 CI 完成后再触发，或无法用定时器时：

1. 在自动化里添加 **Webhook** 触发器，保存后复制 URL 与 API Key。
2. 在仓库添加 secret：`CURSOR_AUTOMATION_WEBHOOK_KEY`。
3. 使用 `.github/workflows/cursor-automation-trigger.yml`（若已添加）或 DEPLOY-GUIDE 旧版 curl 示例，`POST` 到 Webhook URL，`Authorization: Bearer <key>`。

> 公开 REST「按 automation id 触发」需 **Cursor API Key** 与控制台中的 automation id；无 CLI 一键部署。

---

## 第一次跑之前检查清单

- [ ] `.memory-bank/architecture-audit.md` 中有未完成的 P0（`[ ]`）
- [ ] 本地或 CI 上 `forge test` baseline 已知（当前 BSC 安全测试仍有红项则自动化会卡在 Step 3）
- [ ] `node scripts/compile-func.mjs` 22/22 绿（ION FunC）
- [ ] `git push` 到 `origin 2026-05-19-q7fx` 成功

---

## Agent 无法代劳的事项（必须人工）

| 事项 | 原因 |
|------|------|
| 登录 cursor.com | 需要 Master 账号 |
| 连接 GitHub / 选仓库与分支 | OAuth 与组织权限 |
| 创建/启用 Automation、选模型与 Tools | 无公开 CLI |
| 配置 Cloud Agent Secrets | 安全隔离 |
| 批准 GitHub App 对私有仓库的访问 | 组织策略 |
| 为 Team Owned 自动化配置团队 MCP OAuth | 服务账号身份 |

---

## 相关仓库文件

- 自动化定义：`.cursor/automations/ion-dex-autonomous-build.yml`
- 构建顺序：`.memory-bank/architecture-audit.md`
- 会话状态：`SESSION_STATE.md`
- 铁律：`.cursor/rules/ion-dex-iron-law.mdc`
