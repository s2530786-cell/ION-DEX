# Current Session State

## Project

ION DEX: an engineering-grade OKX Web3 wallet style DEX for the ION ecosystem.

## Hard Rules

- All source files must be UTF-8 without BOM.
- Communicate with the user in Simplified Chinese by default.
- No UTF-16, GBK, ANSI, or NUL bytes in source files.
- Every file write must be followed by read-back and encoding verification.
- No implementation step is complete without test evidence.
- Feature development cannot continue past a completed change until the project has passed 100 full green verification runs, unless the user explicitly waives that gate for a narrow investigation.
- If shell execution is unavailable, the user must run the verification commands and paste the output.
- Search for working MCP/tooling before accepting a tooling limitation.
- The agent must proactively use Cursor engineering workflow and development accelerator guidance for every development task. The user should not need to ask for worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy.

## Current State

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

## Current Blocker

Reliable shell execution is confirmed through Desktop Commander MCP. Memory Bank MCP is loaded. ION official source path is confirmed.

## Next Action

1. Continue development with real shell execution via Desktop Commander.
2. Use `cd frontend && npm run dev:local` for frontend runtime verification on `http://localhost:3001/`.
3. Use `D:/openclaw-tools/ion` as the official ION reference source for FunC style, DNS, wallet, multisig, tonlib, lite-client, and API schemes.
4. Use the relevant project skill before each domain task: official source, UI, contract audit, or data backend.
5. Run Agent Review (`/agent-review`) after meaningful diffs and before final verification when available.
6. For every development task, proactively load `.cursor/skills/cursor-engineering-workflow/SKILL.md` and `.cursor/skills/ion-dev-accelerators/SKILL.md` as needed; use `docs/cursor-docs-feature-memory.md` and `docs/development-accelerators-memory.md` as local references.
7. Do not wait for the user to request worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy when they would improve the task.
8. Phase 5 八页业务表单草稿 + E2E：2026-05-18，`scripts/check-encoding.ps1` 已排除本地官方 ION 参考树 `/ion/`（该目录被 `.gitignore` 忽略，不属于本仓源码）；`scripts\verify-100.ps1` 完成 **100-pass**：`PASS 100 OK`，`PASSED=100`，`FAILED=0`，`RESULT=GREEN`。`frontend` `npm run verify` 使用 `start-server-and-test` + **`tcp:127.0.0.1:59333`**，Playwright **`12 passed`**；`audit:high` **`0`**。顶栏导航改为横向滚动可视，修补生产样式下 `hidden lg:flex` 永久隐藏问题。
9. Wallet/Profile shell：2026-05-18，`AppShell` wallet button now opens a local provider picker (Online+ Wallet / ION Browser Wallet / WalletConnect + OKX), drafts a profile session, and supports disconnect without private keys, RPC calls, or signatures. Single full verification after the change: encoding OK, frontend `npm run verify` **13 passed**, `audit:high` **0**. 100-pass gate completed: `PASS 100 OK`, `PASSED=100`, `FAILED=0`, `RESULT=GREEN`.
10. External reference architecture：2026-05-18，`docs/09-reference-architecture.md` added to map the user's reference repositories into ION DEX phases. Key decision: use backend gateway repositories (`tyk`, `shenyu`, `ocelot`) as pattern references only, and start Phase 3 with a minimal typed API gateway/BFF rather than vendoring a full gateway product.
11. Next：start Phase 3 backend foundation with typed mock API endpoints (health/config/tokens/tickers first), or continue Phase 5 toward profile menu polish / transparency-status shell（见 `docs/04-development-roadmap.md`）。

## Memory MCP Candidates

- `alioshr/memory-bank-mcp`: recommended project memory bank.
- `memory-graph/memory-graph`: graph-based persistent memory.
- `Nonymaus/cursor-kg`: local Cursor knowledge graph.
- `gannonh/memento-mcp`: Neo4j-backed memory, more heavyweight.

## Next Development Milestone

After shell and memory tooling are verified:

1. Recreate missing engineering docs.
2. Add encoding verification scripts.
3. Clean generated `.js` ghost files.
4. Add routing and business page shells.
5. Add automated frontend tests before expanding UI.
