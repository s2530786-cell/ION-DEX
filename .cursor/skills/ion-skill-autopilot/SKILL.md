---
name: ion-skill-autopilot
description: ION DEX automatic Skill router. Use proactively at the start of EVERY development task, when touching any module (frontend, backend, contracts, AI/quant, docs, scripts), or when the user asks which skill to use. Resolves paths and keywords to Skills via skill-routing.manifest.json and scripts/skill-route.mjs. Always run before implementation.
---

# ION Skill Autopilot — 自动技能调度

让 Cursor 在开发**任意板块**时自动加载正确 Skill，无需用户每次手动点名。

## 铁律（每次开发任务）

1. **先路由，后写码**：在改任何文件之前执行路由（见下方命令）。
2. **必读清单**：对输出中每个 `SKILLS` 项，用 Read 工具打开对应 `SKILL.md`（`private` 优先于 `public`）。
3. **私有 Skill**：`kronos`、`quant-trading-frameworks` 全量矩阵等在 `.cursor/skills-private/`（链到 `ion-private-core`）。**禁止**把私有 Skill 内容提交到公开 `ion-dex-nuke` 远程。
4. **仍遵守** `docs/00-engineering-standards.md` 与 `AGENTS.md` 验证流程。

## 一键路由命令

```bash
# 根据当前 git 变更
node scripts/skill-route.mjs --git

# 根据用户任务描述（中文/英文关键词）
node scripts/skill-route.mjs --task "实现 Dashboard K线预测与 AI 解读"

# 根据显式路径
node scripts/skill-route.mjs --paths frontend/src/pages/Dashboard.tsx backend/src

# JSON（供脚本/Hook 解析）
node scripts/skill-route.mjs --git --json
```

Windows：

```cmd
scripts\skill-route.cmd --git
```

## Agent 标准工作流

```
用户任务
  → node scripts/skill-route.mjs --git （若有任务描述再加 --task "..."）
  → 读取输出的 BASE + 匹配 SKILLS 的 SKILL.md
  → 读取 DOCS / MEMORY_BANK 列表
  → 若 PREFLIGHT：node scripts/dev-preflight.mjs
  → 若 SECURITY：node scripts/security-preflight.mjs
  → 实现
  → 按 VERIFY 列表验证
  → 大任务后 self-evolving + 更新 SESSION_STATE.md
```

## 路径 → 板块（速查）

| 路径模式 | 路由 id | 主要 Skill |
|----------|---------|------------|
| `frontend/src/**` | frontend-ui | ion-web3-ui |
| `backend/src/**` | backend-data | ion-data-backend |
| `contracts/ion/**`, `*.fc` | contracts-func | ion-contract-audit, ion-official-source |
| `contracts/**/*.sol` | contracts-solidity | ion-contract-audit |
| `scripts/**` | verification-scripts | cursor-engineering-workflow |
| `.memory-bank/**` | memory-bank | ion-dex-memory |
| `.cursor/skills-private/**` | cursor-skills-private | find-skill, skill-vetter |

完整表见 `.cursor/skill-routing.manifest.json`。

## 关键词 → 私有/量化 Skill（速查）

| 关键词 | Skill |
|--------|--------|
| kronos, k线, ohlcv | kronos + quant-trading-frameworks |
| tradingagents, 多智能体, a股 | trading-agents-cn / trading-agents |
| 回测, 网格, quantdinger, octobot | quant-trading-frameworks → 子 Skill |
| moneyprinter, 短视频 | money-printer-turbo（私有） |
| bridge, staking, burn, treasury | ion-contract-audit + ion-data-backend |
| dns, wallet, tonlib | ion-official-source + ion-web3-ui |
| langchain, autogpt, github发现, vendor-ion-discovery | ion-github-daily-discovery + **github-discovered-*** 存根 |

**GitHub 每日发现存根**：任务里出现上游仓库名（如 `langchain-ai/langchain`）时，`skill-route --task` 会列出 `github-discovered-*`；必须先执行 `link-skills-to-ion-dex.ps1`，再 Read 存根 SKILL.md。

## 扩展路由

新增板块时**只改 manifest**（无需改本 Skill 正文）：

1. 编辑 `.cursor/skill-routing.manifest.json` 的 `pathRoutes` 或 `keywordRoutes`。
2. 运行 `node scripts/skill-route.mjs --paths <新路径> --json` 自测。
3. 若为新 Skill，在 `ion-private-core/.cursor/skills/<name>/` 或 `.cursor/skills/<name>/` 添加 `SKILL.md`。
4. 私有 Skill 用 `privateSkills` 数组标注。

## 与 Cursor Rules 的关系

- `.cursor/rules/ion-skill-autopilot.mdc`（alwaysApply）强制本流程。
- 专精规则仍生效：`ion-ui-design-workflow.mdc`、`ion-autonomous-verify.mdc` 等。

## 故障排查

| 现象 | 处理 |
|------|------|
| Skill 显示 MISSING | 运行 `ion-private-core\scripts\link-skills-to-ion-dex.ps1` |
| 路由不准 | 在 manifest 提高该 route 的 `priority` 或补充 `keywords` |
| 严格模式失败 | 勿设 `ION_SKILL_ROUTE_STRICT=1` 除非 CI 已链接私有仓 |
