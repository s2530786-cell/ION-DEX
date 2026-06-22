---
name: ion-github-daily-discovery
description: >-
  Public stub — full GitHub daily discovery Skill lives in ion-private-core (CONFIDENTIAL).
  Use for 全品类开发流程 GitHub 高星发现（AI/MCP/Web3/前端/测试/视频/量化/CI/CD/数据库/K8s 等），每类 Top5 榜、DEX curated 全量存根、vendor 浅克隆。
---

# ION GitHub Daily Discovery（公开仓存根）

**机密内容仅在闭源仓** [ion-private-core](https://github.com/s2530786-cell/ion-private-core)。禁止把目录、存根正文或 `vendor-ion-discovery` 策略推送到公开 `ion-dex-nuke` 远程。

## 本地启用

```powershell
# 1. 克隆私有仓（若尚未）
git clone https://github.com/s2530786-cell/ion-private-core d:\openclaw-tools\ion-private-core

# 2. 链接私有 Skills 到 ion-dex-nuke（junction）
d:\openclaw-tools\ion-private-core\scripts\link-skills-to-ion-dex.ps1

# 3. 在 ion-dex-nuke 根目录执行发现（写入私有仓 .memory-bank）
cd d:\openclaw-tools\ion-dex-nuke
$env:ION_PRIVATE_CORE_ROOT = "d:\openclaw-tools\ion-private-core"
# 完整每日流水线（计划任务同款）
scripts\github-daily.cmd
# 或 node scripts/github-daily-pipeline.mjs

# 分步手动：
node scripts/github-daily-discovery.mjs
node scripts/github-dex-enrich-catalog.mjs
node scripts/github-daily-skill-stubs.mjs
node scripts/github-daily-top.mjs --per-category --limit 5

# Awesome 清单全量解析（无每类 Top5 上限；非 Scraping/Scraping，用 awesome-web-scraping 等）
node scripts/github-daily-awesome-ingest.mjs --merge-catalog
# 或：$env:ION_GITHUB_AWESOME_INGEST="1"; node scripts/github-daily-pipeline.mjs
```

## 如何保证 Agent 随时能调用这些技能

Cursor **不会**自动扫描几百个 `github-discovered-*` 目录；靠下面 **四层** 保证可发现、可加载：

| 层 | 机制 | 作用 |
|----|------|------|
| 1 | **每日流水线** | 刷新目录 + 每类 Top5（+DEX 全量）私有存根 + `discovered-index.md` |
| 2 | **Junction** | `link-skills-to-ion-dex.ps1` → `.cursor/skills-private/github-discovered/...` |
| 3 | **skill-route** | `node scripts/skill-route.mjs --task "..."` 按仓库名/话题匹配存根 |
| 4 | **关键词路由** | 任务含 `langchain`、`github发现` 等 → `kw-github-daily` |

开发前（Agent 铁律）：

```powershell
node scripts/skill-route.mjs --task "你的任务描述"
# 输出 GITHUB DISCOVERED 段时，Read 对应 .cursor/skills-private/github-discovered/*/SKILL.md
```

公开索引（无机密）：`.cursor/skills/ion-github-daily-discovery/discovered-index.md`（流水线每日更新）

## 读完整 Skill

加载 **私有** 路径（二选一）：

- `d:\openclaw-tools\ion-private-core\.cursor\skills\ion-github-daily-discovery\SKILL.md`
- `ion-dex-nuke\.cursor\skills-private\ion-github-daily-discovery\SKILL.md`（junction 后）

## 机密落点

| 资产 | 位置 |
|------|------|
| `latest.json` / `latest.md` / `runs/` | `ion-private-core/.memory-bank/github-daily/` |
| `github-discovered-*` Skills | `ion-private-core/.cursor/skills/github-discovered/` |
| 克隆区 | `d:\vendor-ion-discovery`（本地，gitignore） |
| 查询配置副本 | `ion-private-core/scripts/github-daily-queries.json` |

公开仓仅保留：`scripts/github-daily-*.mjs`、`scripts/ion-private-core-path.mjs`、`docs/github-daily-discovery.md`（操作说明，无目录数据）。
