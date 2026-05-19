# Cursor Automation 部署指南 — 旺财写给 Cursor

## 你手上的自动化文件
`.cursor/automations/ion-dex-autonomous-build.yml` — 已写好，已 push 到 GitHub。

## Automation 能干什么
- ⏰ 每 30 分钟自动从云沙箱启动
- 📋 读 `.memory-bank/architecture-audit.md` 找下一个未完成 P0 任务
- 🔨 实现 → `forge test` → 审计 → 全绿才 commit
- 🛡️ 强制 1500 绿安全铁律
- 🛑 失败 3 次自动标记 BLOCKED

## 部署步骤（Master 操作）

### 方式 1：Web UI 导入（推荐）
1. 登录 https://cursor.com/cn/automations
2. 点击「新建 Automation」
3. 选择「从文件导入」→ 选 `.cursor/automations/ion-dex-autonomous-build.yml`
4. 确认触发器：每 30 分钟
5. 确认 MCP：github + memory-bank
6. 模型选：Claude Sonnet 4 或 Cursor Composer
7. 保存并激活

### 方式 2：GitHub Actions 替代（如果导入不支持）
```yaml
# .github/workflows/cursor-automation.yml
name: Trigger Cursor Automation
on:
  schedule:
    - cron: '*/30 * * * *'
  workflow_dispatch:
jobs:
  trigger:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Cursor Cloud Agent
        run: |
          curl -X POST "https://api.cursor.com/v1/automations/YOUR_AUTOMATION_ID/trigger" \
            -H "Authorization: Bearer ${{ secrets.CURSOR_API_KEY }}"
```

## 第一次跑之前
1. 确认 `.memory-bank/architecture-audit.md` 里有未完成的 P0 任务
2. 确认所有 `forge test` 能跑通（baseline green）
3. 确认 git remote 能正常 push

## 你（Cursor）现在要做的
1. 读取 `.cursor/automations/ion-dex-autonomous-build.yml` 理解任务流程
2. 确认当前 `.memory-bank/architecture-audit.md` 的任务状态
3. 把 Automation 部署指导发给 Master（Master 在 Telegram 等）
4. 告诉 Master 去 https://cursor.com/cn/automations 导入这个 YAML
5. 部署完继续 Phase 5 当前卡住的任务
