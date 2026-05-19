# Current Session State

## 🎯 Master Prompt — Copy to Composer + Ctrl+Shift+Enter

```
SESSION START — ION DEX Full Pipeline

═══════════════════════════════════════════
📋 PURPOSE: 把 ION DEX 从 mock 骨架建成可上线产品
  目标：ION 链用户能用 DEX 交易 ION↔USDT
  路径：前端真数据 → 后端真API → 桥部署 → PancakeSwap LP
═══════════════════════════════════════════
🚫 DO NOT — 绝对禁止
  1. 不写 mock/placeholder/硬编码假数据 — 每个接口对接真实数据源
  2. 不跳过验证 — npm run build 必须 0 error，script 必须全绿
  3. 不凭空设计UI — 必须从 react-bits 110组件里选
  4. 不询问确认 — 改代码/修bug/跑测试直接干，只报告结果
  5. 不浪费主网 gas — 先在 BSC 测试网跑通，验证全绿后再上主网
  6. 不动 ION 链内建协议合约 — multisig-code.fc(config_param 71) 和 votes-collector.fc(config_param 72) 是 ION L1 协议层的，只能读、不能写、不能部署覆盖
  7. 不提交包含 API Key 的代码 — 检查 crsr_/sk-/ghp_/ARK_API_KEY 再 git add
  8. 不产出中文乱码 — 所有文件 UTF-8 无 BOM，中文必须正常显示
     → 写文件后立即读回检查：中文是否可读？出现 锟斤拷/烫烫烫 → 重写
  9. 不写假钱包/假数据源 — 所有数据来自:
     → CMC (`pro-api.coinmarketcap.com`)
     → PancakeSwap Router (`0x10ED43C718714eb63d5aA57B78B54704E256024E`)
     → Uniswap V3 Quoter (`0xb27308f9F90D2F3dcC8a55F0917A4D7AE73A3276`)
     → 真实钱包注入 (MetaMask/OKX/Trust via ethers.js/wagmi/viem)
     → mock/假钱包/假余额/假交易哈希=死刑
═══════════════════════════════════════════
✅ DO — 以下指令按顺序执行，做完一条 commit 一条。不许跳。

📖 TASK 0: 读全量审计
  打开: .memory-bank/architecture-audit.md
  里面写了：24个模块哪些是真哪些是假、P0→P3执行顺序、Agent Build Order
  checkbox 第一个没勾的就是你现在该干的活
  → 没读就不许动手写代码

📖 TASK 1: 读本文件完整内容

⚙️ TASK 2: 编译 FunC 合约
  命令: node scripts/compile-func.mjs
  验收: 终端输出 22/22 PASS
  失败: 读错误→定位根因→修复→重跑→直到全绿
  全绿前不许进入 TASK 3

🏗️ TASK 3: 前端真数据改造（这是大头，每改一个文件跑一次 build，不过不改下一个）
  组件参考: D:\openclaw-data\workspace\repos\react-bits
  钱包库: wagmi/viem + ethers.js，注入真实浏览器钱包，不写假 provider
  
  3a. 价格数据 [frontend/src/lib/ionApi.ts]
      → 删掉所有 mock return
      → ION 价格走 PancakeSwap Router.getAmountsOut(1 ION, [USDT])
      → BSC 价格走 CMC API
      → 调完 CMC API 立刻缓存 localStorage，5分钟过期
      → npm run build 过 → git commit -m "feat: real price from CMC + PancakeSwap"
  
  3b. Dashboard [frontend/src/pages/DashboardPage.tsx]
      → 不再硬编码任何数字
      → TVL = 调 PancakeSwap 查 LP 池储备量
      → 24h volume = 调 BSC 区块浏览器 indexer
      → APR = 从 ionApi.ts 取真实质押收益
      → 显示 "Last updated: HH:MM:SS" 时间戳
      → build 过 → commit
  
  3c. Swap 面板 [frontend/src/pages/SwapPage.tsx]
      → 连接真实钱包: useAccount() → wagmi injected provider
      → Token 选择器: 从 CMC top100 + PancakeSwap 已有池子拉列表
      → 报价: 调 PancakeSwap Router.getAmountsOut(inputAmount, [tokenPath])
      → 滑点: 显示 0.1%/0.5%/1% 选项，写入 swap 参数
      → 执行: 调 Router.swapExactTokensForTokens()，用户签名
      → 交易后显示 BSC 浏览器 tx hash 链接
      → build 过 → commit
  
  3d. 行情图 [frontend/src/components/chart/ 新建]
      → 用 lightweight-charts 或 TradingView widget
      → 数据走 CMC 历史价格 API 或 PancakeSwap 池子价格事件
      → 时间: 1H/4H/1D/1W/1M 可切换
      → build 过 → commit
  
  3e. Pool 页 [frontend/src/pages/PoolPage.tsx]
      → 展示 PancakeSwap 上真实 LP 池: ION/USDT, ION/BNB
      → 添加流动性按钮 → 调 Router.addLiquidity()
      → 移除流动性按钮 → 调 Router.removeLiquidity()
      → 显示你的 LP 仓位余额
      → build 过 → commit
  
  3f. 通用状态
      → loading: skeleton 骨架屏
      → error: 红色提示 + 重试按钮
      → empty: "暂无数据" + 引导文字
      → 移动端: 320px~4K 全适配

✅ TASK 4: 全栈验证
  命令: powershell -File scripts/verify-100.ps1
  验收: 终端输出 PASS 100/100, RESULT=GREEN
  失败: 读报错→定位根因→修复→重跑→直到全绿
  全绿前不许汇报 done

═══ 每个 TASK 单独 commit，commit message 格式: feat/fix/chore: 中文简述 ═══

═══════════════════════════════════════════
✅ DONE 标准 — 每个TASK判定
  TASK 2: 终端输出 "22/22 green" 或 "All contracts compiled"
  TASK 3: npm run build → exit 0, 无 error/warning
  TASK 4: 终端输出 "PASS 100/100, RESULT=GREEN"
  不全绿 → 没完成 → 不汇报 done
  
  ⚠️ 额外检查（每次 commit 前）:
    → npm run build 报 any Chinese garbled? → FAIL
    → 打开 .tsx/.fc 文件看到的不是正常中文而是 锟斤拷/烫烫烫/问号? → FAIL
    → 编码验证: file 命令输出不是 "UTF-8" → FAIL
    → 任一 FAIL → 不 commit → 用 UTF-8 重写文件 → 再读确认
═══════════════════════════════════════════
📊 完成后: git push && 更新 SESSION_STATE.md && 汇报"ALL TASKS DONE"

---

## 🌉 BRIDGE DEPLOYMENT — Master's Roadmap (2026-05-19)

**Priority: After current DEX frontend tasks complete.**

### Architecture
```
ION链 ION  →  官桥  →  ION(BSC)  →  PancakeSwap ION/USDT LP  →  可交易
```

### Shortest Path (3 Steps)
1. **升级 & 部署 Bridge.sol** — Solidity 0.7.0→0.8.26, 对接 BSCVault.sol
   - Source: `D:\openclaw-tools\ice-blockchain-bridge\solidity\Bridge.sol`
   - Verifier: `SignatureChecker.sol` (ECDSA)
   - Deployer: `IONBridgeRouterMainnetDeployer.sol`
2. **启动桥 Relayer** — Node.js 服务监控双链事件
   - ION→BSC: 监听 votes-collector (config_param 72) 放行事件
   - BSC→ION: 监听 Bridge.sol Mint/Burn 事件
3. **创建 PancakeSwap LP** — ION(BSC)/USDT 交易对 + 注入初始流动性
   - Router: `0x10ED43C718714eb63d5aA57B78B54704E256024E`
   - Factory: `0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73`
   - USDT: `0x55d398326f99059fF775485246999027B3197955`

### ION 链端（已就绪，不需改动）
| 合约 | Config | 功能 |
|------|--------|------|
| multisig-code.fc | param(71) | n-of-k 验证者多签 |
| votes-collector.fc | param(72) | ECDSA 签名收集+放行 |

### BSC 端（需部署）
- Bridge.sol (已有, 升级版本)
- BSCVault.sol (已有基础)
- BSC多签合约 (镜像 multisig-code.fc)

### Deployment Scripts Available
- `D:\openclaw-tools\ion-bridge-deploy\` — 70 文件, 含 .fif 部署脚本

Read before starting: `.memory-bank/architecture-audit.md`, `.cursor/skills/ion-official-source/SKILL.md`.
```

---

## Project

ION DEX: an engineering-grade OKX Web3 wallet style DEX for the ION ecosystem.

## User preference (2026-05-19)

- **不要每次询问确认**：Agent 对验证、修复、workflow、scoped 前端/文档改动自行执行并汇报结果；仅在密钥/主网/不可逆删除/需求歧义时联系 Master。
- **每次开发前必读铁律**：起手读 `.memory-bank/development-iron-law-preflight.md` + `.cursor/rules/ion-dex-iron-law.mdc` + `ion-dex-memory` Skill；双链审计与 100 绿命令见预检文档。

## Hard Rules

## 🎯 PRIORITY ORDER — Build This First (2026-05-19 22:02)

> Source: `.memory-bank/architecture-audit.md` (24 gaps found)

| Priority | Count | Key Items |
|----------|-------|-----------|
| 🔴 **P0** | 6 | Security tests→16/16, FunC tests, Backend DB, API→real data, Cross-chain bridge, Deploy scripts |
| 🟠 **P1** | 6 | Indexer, Oracle, Circuit breaker, Liquidity mining, Wallet, Error handling |
| 🟡 **P2** | 8 | Governance, CI/CD, Monitoring, Docker, SDK, Upgrades, Analytics, Security ops |
| 🔵 **P3** | 4 | Mobile, Fiat, Limit orders, i18n |

**Rule:** P0→P1→P2→P3. Never skip. Read `.memory-bank/architecture-audit.md` for full details.

---

## Hard Rules

- All source files must be UTF-8 without BOM.
- Communicate with the user in Simplified Chinese by default.
- No UTF-16, GBK, ANSI, or NUL bytes in source files.
- Every file write must be followed by read-back and encoding verification.
- No implementation step is complete without test evidence.
- Feature development cannot continue past a completed change until the project has passed 100 full green verification runs, unless the user explicitly waives that gate for a narrow investigation.
- If shell execution is unavailable, the user must run the verification commands and paste the output.
- Search for working MCP/tooling before accepting a tooling limitation.

## Master's Permanent Rules (same list as `.memory-bank/README.md`)

These rules are permanent. No agent or developer may remove or weaken them.

1. **Strict architecture compliance**: All code must match `docs/03-technical-architecture.md` + `docs/04-development-roadmap.md` + `docs/05-product-prd.md`. Every feature must trace back to a design doc.

2. **Blockchain audit company standard**: Contracts must pass CertiK/Trail of Bits/OpenZeppelin-level review. Full 10-point security checklist from `.cursor/skills/ion-contract-audit/SKILL.md` on every change.

3. **Fix vulnerabilities immediately**: Zero tolerance for security issues. Compiler warnings, lint errors, audit findings --- fix before continuing. No TODO-skipping security problems.

4. **100-pass gate, 100/100 GREEN**: `scripts/verify-100.ps1` yields `PASS 100/100, FAILED=0, RESULT=GREEN, exit 0`. On Windows transient exit code `-1073741502`, the script retries each failing step once (see `docs/08-ci-agent-automation.md`). No fewer rounds, no yellow, no red.

5. **Commit every step**: One contract / service / page --- one clear git commit. Full traceability.

6. **Full auto-workflow, never wait to be asked**: Agent must self-drive. Detect task --- auto-load Skill --- auto-execute --- auto-verify --- auto-report. User should never need to trigger individual steps.

7. **Search GitHub, download dependencies**: Missing a tool? GitHub is first search source. Find open-source libs (stars >= 50) --- download --- install deps --- integrate --- verify it runs.

8. **Vet every Skill before install**: Run `.cursor/skills/skill-vetter/SKILL.md` on every new skill. Red flags --- refuse install, report to Master.

9. **Use all installed Cursor capabilities**: Worktrees, Agent Review, Bugbot, Cloud Agents, Hooks, CI, MCP tools (Desktop Commander, Memory Bank), Rules, Skills --- pick the optimal path automatically.

- The agent must proactively use Cursor engineering workflow and development accelerator guidance for every development task. The user should not need to ask for worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy.
- The agent must use `cursor-engineering-workflow` as the automatic development workflow and `self-evolving` as the post-work learning loop so useful lessons improve project memory, docs, rules, or Skills.
- The agent must evaluate parallel development worktrees, `/best-of-n`, Agent Review, Bugbot, and code audit paths for non-trivial work; high-risk surfaces require review/audit before being accepted.

## Current State

- **2026-05-19 20:53** — `scripts\verify-100.ps1` **运行中**（后台，约 95s/轮）；已修复 `backend` 幂等 bootstrap 返回 `migrationsApplied: []`；`verify-full-save-log.cmd` **exit 0**；FunC **22/22**；`SecurityAttackTest` **1500/1500**。
- Frontend scaffold exists under `frontend/`.
- Current frontend has a Vite/React/Tailwind skeleton and initial dashboard components.
- There are generated `.js` ghost files under `frontend/src/` from earlier TypeScript emits; these must be cleaned once shell/filesystem execution is reliable.
- `index.html` was rewritten after parse5 reported NUL/UTF-16 corruption.
- Built-in Shell tool appeared non-functional in this environment; Desktop Commander MCP installation was selected as the next tooling fix.
- Desktop Commander was installed by the user, but its setup initially wrote only Claude config. Cursor global MCP config was then created at `C:\Users\admin\.cursor\mcp.json`.
- After Cursor restart, Desktop Commander was still not visible in loaded MCP descriptors, so project-level MCP config was also created at `.cursor/mcp.json`.
- After the next restart, Desktop Commander loaded successfully as MCP server `user-desktop-commander`.
- Desktop Commander command execution was verified with `DC_OK`, `node v22.22.0`, and `npm 11.3.0`.
- Frontend build was executed through Desktop Commander and passed after removing corrupted generated `.js` ghost files and updating Tailwind v4 PostCSS configuration.
- Memory Bank MCP was configured as `ion-dex-memory-bank` in both global Cursor MCP config and project `.cursor/mcp.json`, with root `.memory-bank/`.
- Project-level memory skill has been added at `.cursor/skills/ion-dex-memory/SKILL.md`.
- Chinese language skills have been added globally and at project level:
  - `C:\Users\admin\.cursor\skills\chinese-language\SKILL.md`
  - `.cursor/skills/chinese-language/SKILL.md`
- Cursor IDE Simplified Chinese UI was configured:
  - Installed extension `ms-ceintl.vscode-language-pack-zh-hans`
  - Set `C:\Users\admin\AppData\Roaming\Cursor\User\argv.json` to `{ "locale": "zh-cn" }`
  - Set `C:\Users\admin\.cursor\argv.json` to include `"locale": "zh-cn"` because Cursor may read this runtime arguments file.
  - Set `C:\Users\admin\AppData\Roaming\Cursor\User\settings.json` to include `"locale": "zh-cn"` as compatibility fallback.
  - Verified `argv.json` has no BOM and no NUL bytes.
  - If Chinese UI still does not take effect, fully terminate all Cursor processes before reopening; multiple Cursor background processes were observed.
  - Later diagnostics showed Cursor child processes were launched with `--lang=zh-CN`, and `AppData\Roaming\Cursor\languagepacks.json` registered the Simplified Chinese language pack. If UI panels remain English, it is likely Cursor proprietary UI text not covered by the VS Code Chinese language pack, not an Agent Skill issue.
  - User approved cache reset. Backed up Chinese/NLS cache to `.maintenance/cursor-i18n-backup-20260517-094321`, removed old duplicate zh-hans language pack directory and `languagepacks.json`, then reinstalled `ms-ceintl.vscode-language-pack-zh-hans@1.105.0`.
  - After cleanup, only current zh-hans extension directory remains. Project encoding check passed after the operation.
- Memory Bank MCP is now loaded as `user-ion-dex-memory-bank`.
- User provided the ION official codebase path: `D:/openclaw-tools/ion`.
- Confirmed `.git/config` remote is `https://github.com/ice-blockchain/ion` and README describes it as `Reference implementation of ION Node and tools`.
- Indexed official reusable areas in Memory Bank file `official-source-index.md`: `crypto/smartcont` wallet/multisig/DNS FunC references, `crypto/func`, `tonlib`, `lite-client`, `validator`, and TL API schemes.
- Important caveat: official repo does not contain ready-made DEX/AMM/staking/burn/bridge contracts; DEX contracts must be designed separately while reusing official patterns.
- Runtime frontend connection issue resolved for current session. Vite is running on `http://127.0.0.1:3001/`; `curl` checks against both `127.0.0.1:3001` and `localhost:3001` returned `HTTP/1.1 200 OK`.
- Added `frontend` npm script `dev:local` as a stable local startup command for port `3001`.
- Frontend now has state-driven page switching for `Swap`, `Trade`, `Grid`, `Pool`, `Stake`, `Bridge`, `Burn`, `Domain`, and `AI`.
- Business page shells are implemented in `frontend/src/pages/BusinessPages.tsx` using the existing neon UI system.
- Playwright smoke tests now cover the dashboard, responsive visibility, and navigation into every business page shell.
- `Trade` and `Grid` are now interactive:
  - `Trade` supports side/order selection, amount, price, slippage validation, preview, disabled submit state, and wallet-signing draft confirmation.
  - `Grid` supports mode selection, lower/upper bounds, grid count, investment validation, invalid-bound error state, preview, disabled submit state, and AI Sentinel gated draft confirmation.
  - Playwright smoke tests cover Trade limit-order drafting and Grid bounds/strategy drafting.
- `Pool` and `Stake` are now interactive (draft payloads only, no on-chain mint/stake):
  - Pool: BNB/ION amounts, slippage bounds, preview, submit enables liquidity mint draft confirmation.
  - Stake: stake/unstake mode, amount validation, APR preview line, draft confirmations per mode.
  - Playwright smoke covers pool slippage error/recovery and stake/unstake draft flows.
  - Stake E2E uses `data-testid="stake-submit"` for enabled assertions (avoids Playwright strict-mode collisions with mode toggle buttons labeled similarly).
- `frontend/playwright.config.ts` uses a Windows-safe `cmd.exe /d /c` wrapper for preview webServer startup.
- Trade/Grid milestone verification completed on 2026-05-17:
  - single baseline: encoding, frontend verify, and high audit all exited `0`
  - required 100-pass gate: `PASS 100/100`, `RESULT=GREEN`, exit code `0`
- Agent-side automated verification is working through a log-file loop:
  - run commands from the agent
  - write outputs to `%TEMP%`
  - read the result files back into the agent
  - use exit codes as the source of truth
- A 100-pass verification gate is now required before continuing feature development.
- Project-specific Cursor Skills added:
  - `.cursor/skills/ion-official-source/SKILL.md`
  - `.cursor/skills/ion-web3-ui/SKILL.md`
  - `.cursor/skills/ion-contract-audit/SKILL.md`
  - `.cursor/skills/ion-data-backend/SKILL.md`
  - `.cursor/skills/cursor-engineering-workflow/SKILL.md`
  - `.cursor/skills/ion-dev-accelerators/SKILL.md`
- User-requested agent capability Skills installed:
  - `.cursor/skills/skill-vetter/SKILL.md`
  - `.cursor/skills/self-evolving/SKILL.md`
  - `.cursor/skills/tavily/SKILL.md`
  - `.cursor/skills/find-skill/SKILL.md`
  - `.cursor/skills/luke-agent-browser-clawdbot/SKILL.md`
  - `.cursor/skills/summarize-pro/SKILL.md`
  - `.cursor/skills/claude-flow/SKILL.md`
- Claude-Flow/RuFlo status:
  - Root dev dependency `claude-flow@3.7.0-alpha.35` is installed and pinned in `package.json`.
  - CLI verified with `npx claude-flow@3.7.0-alpha.35 --version`, output `ruflo v3.7.0-alpha.35`.
  - `init check` reports RuFlo is not initialized in this directory.
  - `doctor --component mcp` reports no Claude-Flow MCP config found.
  - `agent wasm-status` reports `@ruvector/rvagent-wasm` is not installed.
  - Root `npm audit --audit-level=high --json` reports 1 critical and 10 high vulnerabilities in Claude-Flow transitive dependencies; use only as a controlled local accelerator unless isolated and explicitly planned.
  - A `mcp start --help` attempt started the stdio MCP server instead of showing help; the process was stopped. Do not run `mcp start`, `start`, `daemon`, `autopilot`, or `init --start-all` casually.
  - Post-update project verification: `scripts\verify-full-save-log.cmd --no-pause` exited `0`; encoding scanned 167 files OK; frontend build and Playwright passed (`13 passed`); frontend `audit:high` found 0 vulnerabilities. Separate root Claude-Flow audit still reports high/critical findings.
  - Cautious sandbox validation created isolated Git worktree `D:\openclaw-tools\ion-dex-nuke-claude-flow-sandbox` on branch `claude-flow-sandbox`.
  - Sandbox `init --minimal --skip-claude --no-global` succeeded but still generated `CLAUDE.md`, `.claude/`, `.claude-flow/`, and `.mcp.json`; do not initialize directly in main repo.
  - Sandbox diagnostics: `init check` initialized, `doctor --component mcp` healthy with 1 `ruflo` server, `agent list` no active agents.
  - Generated `.mcp.json` used `ruflo@latest`; main integration must pin to `claude-flow@3.7.0-alpha.35` or a reviewed command.
  - Generated `.claude/settings.json` enabled hooks, auto learning, security scans, and broad command permissions; do not import into main without security review.
- Cursor Agent Review rules added at `BUGBOT.md` for ION DEX security, verification, UI, backend, and review-output standards.
- The 100-pass verification gate completed successfully on 2026-05-17:
  - `PASSED=100`
  - `FAILED=0`
  - `RESULT=GREEN`
- Cursor official documentation was indexed into project memory:
  - `docs/cursor-docs-feature-memory.md`
  - Source pages: `https://cursor.com/cn/docs` and `https://cursor.com/llms.txt`
  - Covered areas include Agent, Agent Review, Rules, Skills, MCP, Hooks, Subagents, Inline Edit, Tab, Cloud Agents, Bugbot, CLI, SDK, integrations, models/pricing, security/privacy, Teams, Enterprise, and troubleshooting.
  - The `cursor-engineering-workflow` skill turns this documentation memory into a proactive workflow for every development, verification, review, debugging, workflow, or tooling task.
- Development accelerators were indexed into project memory:
  - `docs/development-accelerators-memory.md`
  - Covered areas include Git worktrees, Cursor `/worktree`, `/best-of-n`, Hooks, Agent Review, Bugbot, Cloud Agents, Cursor CLI/GitHub Actions, CI autonomy levels, MCP tools, Rules, and Skills.
  - The `ion-dev-accelerators` skill proactively selects the right accelerator while preserving ION DEX safety and verification gates.
- Phase 3 backend foundation first slice completed on 2026-05-18:
  - Added `backend/` TypeScript API gateway with `GET /api/health`, `GET /api/config/public`, `GET /api/tokens`, and `GET /api/markets/tickers`.
  - Responses use `{ data, meta }` with mock provenance, ISO `updatedAt`, `stale`, and normalized `requestId`.
  - Added backend API tests, typecheck/build, high-severity audit wrapper, and local stress smoke.
  - Frontend ticker strip now fetches `/api/markets/tickers` through `frontend/src/lib/ionApi.ts` and keeps an offline fallback for static preview/E2E.
  - `verify-full.cmd`, `verify-full.ps1`, `verify-100.ps1`, and GitHub Actions now include backend verify, backend audit, backend stress, frontend verify, and frontend audit.
  - Frontend verify now uses a dynamic preview port via `frontend/scripts/verify-e2e.mjs`, avoiding fixed-port collisions during 100-pass loops.
  - `audit:high` now uses retry wrappers for transient npm registry/proxy failures while still failing on real high-severity vulnerabilities.
  - Independent read-only code review found and drove fixes for frontend audit exit-code handling, 100-pass backend stress coverage, generated-file ignores, request-id normalization, and CI/doc verification parity.
  - Verification evidence: direct `scripts\verify-full.cmd` exited `0`; latest 100-pass gate completed `PASS 100/100`, `RESULT=GREEN`, exit code `0` after 4,001,376 ms.
- Phase 3 backend gateway second slice completed on 2026-05-18:
  - Added public mock endpoints `GET /api/burn/summary`, `GET /api/staking/summary`, `GET /api/bridge/routes`, `GET /api/domain/resolve?name=`, and `GET /api/profile/demo`.
  - Added `.ion` domain validation, stable `ION_DEX_E_*` error codes, OPTIONS `X-Request-Id` tracing, and payload-level provenance for mock financial/chain data.
  - Expanded backend API tests to 12 passed, including burn/staking/bridge/domain/profile, domain validation errors, stable error contracts, and OPTIONS tracing.
  - Expanded backend stress smoke to all 9 public endpoints, defaulting to 120 requests per endpoint with 24-way concurrency and response/provenance contract checks.
  - Independent read-only review found mock-data mislabeling risk, stress-smoke scope limits, error-code drift, and OPTIONS tracing gaps; code now fixes the contract/tracing/provenance findings, while production-grade k6/wrk load remains a future task.
  - Verification evidence: direct `scripts\verify-full.cmd` exited `0`; expanded 100-pass gate completed `PASS 100/100`, `RESULT=GREEN`, exit code `0` after 3,899,653 ms.

## Current Blocker

Reliable shell execution is confirmed through Desktop Commander MCP. Memory Bank MCP is loaded. ION official source path is confirmed.

## Agent automation (Cursor Hooks)

**全自动工作流（本地一键）**：`scripts\agent-autonomous-workflow.cmd`（preflight → FunC 22/22 → `agent-verify`）。VS Code：**Run Task** → **`ION DEX: autonomous workflow (preflight+compile+verify)`**（默认测试任务）。

**Canonical ordered workflow (steps 0–9):** see **`docs/08-ci-agent-automation.md`** section **自动工作流列表**.

- **stop**: Runs `.cursor/hooks/ion-verify-on-stop.cmd`: if `scripts\compile-func.mjs` exists, compile `contracts/ion` first; then `scripts\agent-verify.cmd` (equiv. `verify-full.cmd` with `ION_VERIFY_NONINTERACTIVE=1`). Hook config `.cursor/hooks.json`: `timeout` 900, `failClosed: false`.
- **every save (Agent / Tab)**: `afterFileEdit` / `afterTabFileEdit` invoke `node scripts/ion-on-save-pipeline.mjs --cursor-hook` (quick encoding check on `file_path` + `compile-func.mjs`); `timeout` 540, `failClosed: false`.
- **every save (Ctrl+S)**: `.vscode/settings.json` → **Run On Save** (`emeraldwalk.RunOnSave`); see `.vscode/extensions.json` recommendation. Without the extension, only Agent/Tab hook paths run the on-save compile gate.
- **Session memory order**: `.memory-bank/README.md` → `docs/99-current-progress.md` → narrative/history in `SESSION_STATE.md`. Treat `docs/99-current-progress.md` as canonical progress vs dated bullets here.
- **VS Code**: See `.vscode/tasks.json` labels starting with `ION DEX:` (agent-verify, verify-full-save-log, verify-100).

## Next Action

**Current (2026-05-19):** Dual-chain audit gates — `scripts/dual-chain-audit.mjs` (ION FunC **1500/1500** static + BSC **SecurityAttackTest 16/16**), `scripts/func-security-audit.mjs`, `scripts/verify-100-dual-chain.ps1`. `verify-100.ps1` 每轮含 `dual-chain-audit`. **Next:** 跑满 `verify-100-dual-chain.ps1 -Iterations 100`；P0-4 RPC+CMC。

1. Continue development with real shell execution via Desktop Commander.
2. Use `cd frontend && npm run dev:local` for frontend runtime verification on `http://localhost:3001/`.
3. Use `D:/openclaw-tools/ion` as the official ION reference source for FunC style, DNS, wallet, multisig, tonlib, lite-client, and API schemes.
4. Use the relevant project skill before each domain task: official source, UI, contract audit, or data backend.
5. Run Agent Review (`/agent-review`) after meaningful diffs and before final verification when available.
6. For every development task, proactively load `.cursor/skills/cursor-engineering-workflow/SKILL.md` and `.cursor/skills/ion-dev-accelerators/SKILL.md` as needed; use `docs/cursor-docs-feature-memory.md` and `docs/development-accelerators-memory.md` as local references.
7. Do not wait for the user to request worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy when they would improve the task.
8. Phase 5 / nav + E2E (2026-05-18): Encoding scan OK; `/ion/` reference excluded via `.gitignore`; **`scripts\verify-100.ps1`** **`RESULT=GREEN`**; **`npm run verify`** uses **`tcp:127.0.0.1:59333`** readiness; Playwright **12 passed**, **`audit:high`** **0**; **`hidden lg:flex`** nav caveat fixed with scrollable nav strip.
9. Wallet/Profile shell (2026-05-18): `AppShell` wallet opens local provider picker; profile drafted; disconnect without keys; verify ? **`npm run verify`** **13 passed**, **`audit:high`** **0**, 100-pass **`RESULT=GREEN`**.
10. External reference architecture (2026-05-18): **`docs/09-reference-architecture.md`** ? gateways (`tyk`/`shenyu`/`ocelot`) are pattern refs only; Phase 3 BFF-first.
11. Skills (2026-05-18): `skill-vetter`, **`self-evolving`**, **`tavily`**, **`find-skill`**, **`luke-agent-browser-clawdbot`**, **`summarize-pro`** wired in **`AGENTS.md`**.
12. Workflow (2026-05-18): Prefer **`cursor-engineering-workflow`** + **`self-evolving`** loops.
13. Accelerators (2026-05-18): Worktrees + review/audit for non-trivial work.
14. Claude-Flow/RuFlo (2026-05-18): Pinned **`3.7.0-alpha.35`**; main has no MCP/daemon/WASM ? treat as constrained local tool; **`verify-full-save-log`** **OK** separately from dependency audit findings.
15. Phase 3 Bridge/Domain slice (2026-05-19): **`fetchBridgeRoutes`** / **`fetchDomainResolve`**; **`BridgeMetricsRow`** + **`DomainMetricsRow`** (`custodian.ion`); E2E **`bridge-metrics-source`** / **`domain-metrics-source`**; **`verify-full-save-log.cmd --no-pause`** exit **0**; Playwright **13 passed**. **`verify-100.ps1`** retries Windows transient **`-1073741502`** per step once; heavy 100-pass: run from **standalone** **`cmd`/`pwsh`** if Cursor shell flaky. Next: **`/api/bridge/routes`** registry parity, Redis/PostgreSQL drafts.
## 🔥 旺财总经理 24/7 Auto-Workflow (2026-05-19 铁律)

> 旺财总经理下达。死命令。永不停止。安全第一位。

### 🔒 Security-First Iron Law (安全第一位)
```
写智能合约 → 10类Web3攻击防御测试 → 抗量子攻击验证 →
1000次全绿 → 才能进入下一步
```

**10 类必测攻击（每类最低 100 次绿）：**
1. 重入攻击 | 2. 闪电贷 | 3. 三明治攻击 | 4. 预言机操控
5. 权限绕过 | 6. 整数溢出 | 7. 拒绝服务 | 8. 假币攻击
9. 时间戳操控 | 10. 抗量子攻击

**安全总数：10类 × 100次 = 1000次全绿底线**

### Iron Law Cycle (每个开发部分必须循环)：
```
读 SESSION_STATE.md → 编译 → 审计漏洞 → 修复 → 重编译 → commit →
1000次安全攻击测试 → 通不过回第三步重来
```

### Self-Review Protocol (自主审查)
- **不需要人工确认。** 自己审查、自己验证、自己修补漏洞。
- 每次代码改动后：自查 → 找问题 → 修 → 重验。
- 发现漏洞立即修复，不等人指出。
- 把每行代码当作 CertiK / Trail of Bits 审计对象对待。

### Continuous Operation Protocol

**You work 24 hours a day. Never idle. Never stop.**

1. **完成 Phase N → 立即开始 Phase N+1。不等。不休息。**
2. **每 30 分钟运行一次：recompile → audit → fix → commit 循环。**
3. **遇到阻塞 → 记录到 SESSION_STATE.md，commit 当前进度，找下一个独立任务继续。**
4. **绝不输出 "waiting for user" —— 找其他事做或重跑审计。**
5. **每次 git commit 必须 push 到 `origin 2026-05-19-q7fx`。**

### 100-Pass Iron Gate
- **100/100 GREEN 是底线。** 99 绿 + 1 红 = FAIL。
- **区块链公司最严厉审计标准** — 每次都要过：重入、溢出、权限控制、逻辑错误、边界值。
- **暴力测试** — 模糊输入、畸形数据、边界值、竞态条件。
- 任何测试失败 → 回到审计步骤（Step 3），不作弊。

### Post Phase 5 Roadmap

After Phase 5 (frontend):
- **Phase 6:** FunC contracts (DexRouter, IonAmmPool, LimitOrderBook, GridStrategyVault, StakingPool, FeeDistributor, Treasury, OracleAdapter, DomainMarketplace, DomainResolverAdapter) — each contract: write → compile → audit → 100 tests → commit
- **Phase 7:** BSC contracts (BSCVault.sol, BridgeVerifier.sol, BSCFeeVault.sol) — each contract: write → forge build → audit → 100 tests → commit
- **Phase 8:** Indexer + Backend complete → 全栈集成测试 100 pass
- **Phase 9:** E2E 部署 → 主网上线前最终审计

## Memory MCP Candidates

- `alioshr/memory-bank-mcp`: recommended project memory bank.
- `memory-graph/memory-graph`: graph-based persistent memory.
- `Nonymaus/cursor-kg`: local Cursor knowledge graph.
- `gannonh/memento-mcp`: Neo4j-backed memory, more heavyweight.

## Current Task (`ion-autonomous-verify` + phased roadmap; synced 2026-05-19)

**Truth for shipped verification:** **`docs/99-current-progress.md`**. MCP durable root: **`.memory-bank/`**.

### PHASE 5 — Core Frontend (7 steps) ✅ DONE (2026-05-19)

| Step | Deliverable | Commit (branch `2026-05-19-q7fx`) |
|------|-------------|-----------------------------------|
| 1 | DashboardPage + ionApi loading/error/empty | `1fd3632` (with steps 2–3) |
| 2 | SwapPage | `1fd3632` |
| 3 | PoolPage | `1fd3632` |
| 4 | StakePage | `a380e4d` |
| 5 | Burn + Bridge in BusinessPages | `a380e4d` / prior shells |
| 6 | AppShell sidebar + mobile drawer (`motion.button` / `motion.aside`; no `motionmotion*` tags) | **`f13ab94`** |
| 7 | Full stack verify + E2E nav helpers | **(this session commit)** |

**Step 7 evidence (2026-05-19):**

- `node scripts/compile-func.mjs` → **22/22** green  
- `node contracts/ion/scripts/compile-all.js` → **6/6** entry modules OK  
- `frontend/npm run build` → OK  
- `scripts/verify-full-save-log.cmd --no-pause` → **exit 0** (`%TEMP%\ion-verify-full.txt`)  
  - Encoding **1136** files UTF-8 no BOM  
  - Backend **19/19** tests + stress 9 endpoints + audit:high **0**  
  - Frontend Playwright **13/13** passed  

**Iron Law V:** No `motionmotion*` garbage in `frontend/src` (grep clean).

### Autonomous block (baseline)

Per **`.cursor/rules/ion-autonomous-verify.mdc`**: Task 1 baseline **`303745a`**.

**铁律循环 2026-05-19：** 编译 **22/22** → 审计修复 → 重编译 → commit **`7b29f8b`** → **`forge test` SecurityAttackTest 1500/1500** → **`verify-100.ps1` 运行中**。

修复摘要：`BSCVault` 单调 `withdrawalNonce`、零额 revert、`setThreshold` 上限、`recoverETH` call；FunC `deployer`/`router::get_pool_address` 写入真实 router 地址。

**NEXT:** Phase 6 FunC greenfield (`DexRouter.fc` …) per roadmap below; BSC security tests; backend DB layer.

Commands after edits: **`scripts/agent-verify.cmd`** or **`ION_VERIFY_NONINTERACTIVE=1 scripts/verify-full.cmd`**.

### Roadmap backlog (single-file contracts, do not batch casually)

Skills: **`ion-contract-audit`**, **`ion-official-source`**. Official tree: **`D:/openclaw-tools/ion`**.

**FunC (`contracts/ion/`)**, in order:

1. **`DexRouter.fc`** ? swap routing, path resolution, fee forwarding  
2. **`IonAmmPool.fc`** ? constant-product AMM, liquidity add/remove, swap, fees  
3. **`LimitOrderBook.fc`** ? orders / match / cancel  
4. **`GridStrategyVault.fc`** ? grid params, rebalance, LP bookkeeping  
5. **`StakingPool.fc`** ? deposit/withdraw rewards, emergency path  
6. **`FeeDistributor.fc`** ? fee collection + treasury splits  
7. **`Treasury.fc`** ? multisig treasury  
8. **`OracleAdapter.fc`** ? signed prices + TWAP fallback  
9. **`DomainMarketplace.fc`** ? `.ion` marketplace  
10. **`DomainResolverAdapter.fc`** ? resolution + ownership proofs  

**BSC (`contracts/bsc/`, Foundry):** **`BSCVault.sol`**, **`BridgeVerifier.sol`**, **`BSCFeeVault.sol`**.

### Verification policy

- After material change: **`verify-full-save-log.cmd --no-pause`** (agent) or **`agent-verify.cmd`**.  
- **100-pass:** **`scripts/verify-100.ps1`** retries exit **`-1073741502`** once per step (**`Run-StepResilient`**); prefer **standalone** **`cmd.exe`/`pwsh`** for long gates if Cursor-embedded shells glitch.  
- Log path when stdout quiet: **`%TEMP%\ion-verify-full.txt`**.
- Encode everything **UTF-8 without BOM**.
- Agents should track progress via **git history** + **`docs/99-current-progress.md`** entries per milestone.
