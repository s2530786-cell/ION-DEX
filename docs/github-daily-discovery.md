# GitHub 每日高星发现（ION DEX）

自动扫描 GitHub 上与 **ION DEX 全链聚合平台** 相关的高星开源项目，并接入 **Skill Autopilot** 路由。

> **机密**：目录数据、`github-discovered` Skill 正文仅写入闭源仓 [ion-private-core](https://github.com/s2530786-cell/ion-private-core)。公开 `ion-dex-nuke` 只保留脚本与本文档，**禁止**提交 `latest.json` / `github-discovered/`。

## 覆盖领域

- AI / Agent / MCP / RAG
- Web3 DEX、DeFi、跨链桥、钱包、Indexer
- 智能合约（Solidity / TON·FunC）
- 全栈（React / Vite / TypeScript）
- UI / 设计系统 / CSS 动效（GSAP、WAAPI 等）
- 视频生成（HyperFrames、Remotion 等）
- 音频 / TTS
- 3D / WebGL（Three.js、TypeGPU）
- 量化交易（对接 `vendor-quant` 与私有 Skills）
- E2E / 安全 / 可观测性

## 发现范围：三种 Profile

| Profile | 含义 | 品类数 |
|---------|------|--------|
| **`full`**（**默认**） | ION 研发向 + **GitHub 全域 taxonomy** | **89** |
| `broad` | 仅全域：语言榜、OS/嵌入式/FPGA、ML、游戏、科学、CMS、移动、非 DEX 链、IoT… | 59 |
| `ion-dev` | 仅 ION 产品栈（AI/MCP/Web3/前端/测试…） | 30 |

- 全域清单：`scripts/github-daily-queries-broad.json`（可持续往里面加 topic）
- 查看全部类 ID：`node scripts/github-daily-taxonomy-list.mjs`

**每个品类** discovery 后各取星数 **Top 5** 生成存根；`web3-dex-curated` 为 **19 个 DEX 对标库全量**。

GitHub 无「全站每个 topic 自动 Top5」API；`full` 一次约 **89 次 Search**，务必配置 Token。

```powershell
cd d:\openclaw-tools\ion-dex-nuke
$env:ION_PRIVATE_CORE_ROOT = "d:\openclaw-tools\ion-private-core"

# 1) 刷新全域 + ION 目录（默认 profile=full，需 Token）
node scripts/github-daily-discovery.mjs --profile full
# 仅全域 taxonomy：node scripts/github-daily-discovery.mjs --profile broad
# 仅 ION 31 类：node scripts/github-daily-discovery.mjs --profile ion-dev

# 2) 查看每类 Top 5 摘要
node scripts/github-daily-top.mjs --per-category --limit 5

# 3) 为「每类 Top5 + DEX 全量」生成私有 Skill 存根（github-daily-stub-repos.json）
node scripts/github-daily-skill-stubs.mjs

# 4) 可选：浅克隆 curated DEX
node scripts/github-daily-install.mjs --curated
```

配置：`scripts/github-daily-stub-repos.json`（`limitPerCategory`、`includeAllCategoryIds`）。

## Awesome 清单「全量爬取」（无 Top5 上限）

GitHub 上 **不存在** `Scraping/Scraping` 仓库；等价做法是：**浅克隆 awesome 清单仓 → 解析 README 里全部 `github.com/owner/repo` → 每个仓库一个 `github-discovered-*` Skill 存根**。

| 脚本 | 作用 |
|------|------|
| `scripts/github-daily-awesome-sources.json` | 要克隆的 awesome 源（默认 `lorien/awesome-web-scraping`） |
| `scripts/github-daily-awesome-ingest.mjs` | 克隆 + 解析 + 写存根 + 可选合并进 `latest.json` |

```powershell
$env:ION_PRIVATE_CORE_ROOT = "d:\openclaw-tools\ion-private-core"

# 默认源：lorien/awesome-web-scraping（整仓 README 链接）
node scripts/github-daily-awesome-ingest.mjs --merge-catalog

# 指定仓库（用户说的「Scraping」通常指此类 awesome 列表）
node scripts/github-daily-awesome-ingest.mjs --repo lorien/awesome-web-scraping --merge-catalog

# 启用配置里所有 enabled 源（大列表可设 maxReposPerSource）
node scripts/github-daily-awesome-ingest.mjs --all-enabled --merge-catalog

# 快速试跑（不调用 GitHub API 补星数）
node scripts/github-daily-awesome-ingest.mjs --no-enrich

# 并入每日流水线
$env:ION_GITHUB_AWESOME_INGEST = "1"
node scripts/github-daily-pipeline.mjs
```

产出：

- `ion-private-core/.memory-bank/github-daily/awesome-ingest/<source-id>.json`
- `ion-private-core/.cursor/skills/github-discovered/github-discovered-*`（每个链接一存根）
- 合并后目录多一类：`awesome-ingest-<source-id>`

在 `github-daily-awesome-sources.json` 里把更多 awesome 仓 `enabled: true` 即可扩展；超大列表用 `maxReposPerSource` 限流。

若只要 **全局** Top N（旧行为）：将 `mode` 改为 `catalog-top` 并设 `limit` / `scope`（`all-dev` 或 `overall`）。

仅 DEX 协议实现对标：`node scripts/github-daily-top.mjs --limit 5 --scope dex-curated`（需先 `github-dex-enrich-catalog.mjs`）。

## 真实 DEX 实现库（推荐）

搜索 API 易限流且易命中噪音，对 **已知 DEX 仓库** 用 Repos API 直拉：

```powershell
$env:ION_PRIVATE_CORE_ROOT = "d:\openclaw-tools\ion-private-core"
node scripts/github-dex-enrich-catalog.mjs
node scripts/github-daily-skill-stubs.mjs
```

清单：`scripts/github-dex-curated-repos.json` → 写入目录品类 `web3-dex-curated`。

仅补跑部分 DEX 搜索品类（合并进现有 `latest.json`）：

```powershell
node scripts/github-daily-discovery.mjs --categories web3-dex-uniswap-class,web3-dex-curve-balancer,web3-dex-aggregators --merge
```

无 Token 时 Repos API 会限流：`github-dex-enrich-catalog.mjs` 会保留已缓存元数据，其余写入 **placeholder** 条目；`github-daily-skill-stubs.mjs` 仍可为 `github-dex-curated-repos.json` 中全部仓库生成存根。

**勿**对私有仓运行 `sync-github-daily-to-private.mjs` 覆盖 `latest.json`（该脚本已不再从公开仓同步目录）。

## 快速开始

```powershell
# 1. 设置 Token（强烈推荐，否则 API 限流很严）
$env:GITHUB_TOKEN = "ghp_..."
# 或 scripts/.github-token.local

# 2. 发现
node scripts/github-daily-discovery.mjs

# 3. 查看报告（在私有仓）
$env:ION_PRIVATE_CORE_ROOT = "d:\openclaw-tools\ion-private-core"
Get-Content "$env:ION_PRIVATE_CORE_ROOT\.memory-bank\github-daily\latest.md"

# 4. 列出可安装仓库
node scripts/github-daily-install.mjs --list

# 5. 浅克隆 Top N 到 vendor 目录
node scripts/github-daily-install.mjs --top 5
```

## 输出文件（均在 ion-private-core）

| 路径 | 说明 |
|------|------|
| `ion-private-core/.memory-bank/github-daily/latest.json` | 机器可读全量目录 |
| `ion-private-core/.memory-bank/github-daily/latest.md` | 人类可读 Markdown 摘要 |
| `ion-private-core/.memory-bank/github-daily/runs/YYYY-MM-DD.json` | 按日归档 |
| `ion-private-core/.memory-bank/github-daily/installed.json` | 已克隆记录 |
| `ion-private-core/.cursor/skills/github-discovered/` | 上游 Skill 存根 |

默认克隆目录：`d:\vendor-ion-discovery`（可用 `ION_VENDOR_DISCOVERY_ROOT` 覆盖）。

## 与 Skill 路由集成

1. 每个仓库条目含 `suggestedSkills` → 对应 `.cursor/skills/` 或 `.cursor/skills-private/`。
2. 任务含「GitHub 发现 / 高星 / trending」→ `keywordRoutes` 的 `kw-github-daily` 加载本 Skill。
3. 改查询条件：编辑 `scripts/github-daily-queries.json`，再跑 discovery。

## Token（完整发现必配）

```powershell
Copy-Item scripts\github-daily-token.local.example scripts\.github-token.local
# 编辑 .github-token.local：单行 PAT（public_repo 只读即可）
node scripts\load-github-token.mjs   # 应输出 loaded (value hidden)
```

## Skill 存根（公开仓仅指针）

```powershell
node scripts\github-daily-install.mjs --curated
node scripts\github-daily-skill-stubs.mjs
# 输出：.cursor/skills/github-discovered/github-discovered-*/
```

## 每日自动化（完整流水线）

计划任务执行 `scripts\github-daily.cmd` → `scripts\github-daily-pipeline.mjs`，**按顺序**：

| 步骤 | 脚本 | 产出 |
|------|------|------|
| 1 | `github-daily-discovery.mjs --profile full` | 全域+ION 目录 `latest.json` / `latest.md`、按日 `runs/` |
| 2 | `github-dex-enrich-catalog.mjs` | 合并 `web3-dex-curated`（19 个 DEX 对标库） |
| 3 | `github-daily-skill-stubs.mjs` | 每类 Top5 + DEX curated 全量 → `github-discovered-*` 存根 |
| 4 | `github-daily-top.mjs --per-category --limit 5` | 控制台按品类 Top 5 摘要 |
| 5 | `sync-github-discovered-public-index.mjs` | 公开 `discovered-index.md` 供 Cursor/路由 |
| 可选 | `github-daily-install.mjs --curated` | 仅当 `ION_GITHUB_DAILY_CLONE=1` 时浅克隆 |

## Agent 如何随时调用 discovered 技能

1. **一次性**：`ion-private-core\scripts\link-skills-to-ion-dex.ps1`（junction → `.cursor/skills-private/`）
2. **每次开发前**：`node scripts/skill-route.mjs --task "集成 langchain / Uniswap interface ..."`
3. **读输出里的** `GITHUB DISCOVERED` → 打开对应 `skills-private/github-discovered/<id>/SKILL.md`
4. **索引文件**：`.cursor/skills/ion-github-daily-discovery/discovered-index.md`

运行日志：`ion-private-core/.memory-bank/github-daily/runs/pipeline-YYYY-MM-DD.log`

**一键注册计划任务（推荐）**

```powershell
cd d:\openclaw-tools\ion-dex-nuke
powershell -ExecutionPolicy Bypass -File scripts\register-github-daily-task.ps1
schtasks /Run /TN "ION-GitHub-Daily-Discovery"
```

**本地试跑整条流水线**

```powershell
cd d:\openclaw-tools\ion-dex-nuke
scripts\github-daily.cmd
# 或
node scripts\github-daily-pipeline.mjs
```

**环境变量**

| 变量 | 默认 | 说明 |
|------|------|------|
| `ION_PRIVATE_CORE_ROOT` | 自动探测 `d:\openclaw-tools\ion-private-core` | 目录与 Skill 写入位置 |
| `ION_GITHUB_DAILY_SKIP_ENRICH` | 关 | `1` 跳过 DEX enrich |
| `ION_GITHUB_DISCOVERY_PROFILE` | `full` | `ion-dev` / `broad` / `full` |
| `ION_GITHUB_DAILY_SKIP_STUBS` | 关 | `1` 跳过 Skill 存根 |
| `ION_GITHUB_DAILY_CLONE` | 关 | `1` 每日浅克隆 curated DEX（体积大，一般不推荐） |

**手动配置任务**

- 程序：`cmd.exe`
- 参数：`/c "d:\openclaw-tools\ion-dex-nuke\scripts\github-daily.cmd"`
- 触发器：每天 08:00

**Cursor Loop**（开发机）

- 使用 `loop` Skill 每日执行 `scripts\github-daily.cmd`

## 安全与合规

- 发现结果默认 **gitignore**（不提交到公开仓）。
- 采纳前用 `skill-vetter` + 许可证审查。
- 商业机密 Skill、量化策略、私有 fork **仅** `ion-private-core` + 本地 vendor，勿推公开远程。

## 相关

- `.cursor/skills/ion-github-daily-discovery/SKILL.md`
- `docs/cursor-skill-autopilot.md`
- `docs/08-ci-agent-automation.md`
