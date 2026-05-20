# Current Session State

## Project

ION DEX: an engineering-grade OKX Web3 wallet style DEX for the ION ecosystem.

## Hard Rules

- All source files must be UTF-8 without BOM.
- Communicate with the user in Simplified Chinese by default.
- Before any development work, read `docs/00-engineering-standards.md` as the development iron law.
- Before UI/frontend work, read `docs/10-ui-design-route.md` and run `node scripts/dev-preflight.mjs` when shell access is available.
- No UTF-16, GBK, ANSI, or NUL bytes in source files.
- Every file write must be followed by read-back and encoding verification.
- No implementation step is complete without test evidence.
- Feature development cannot continue past a completed change until the project has passed 100 full green verification runs, unless the user explicitly waives that gate for a narrow investigation.
- If shell execution is unavailable, the user must run the verification commands and paste the output.
- Search for working MCP/tooling before accepting a tooling limitation.
- The agent must proactively use Cursor engineering workflow and development accelerator guidance for every development task. The user should not need to ask for worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy.
- The agent must use `cursor-engineering-workflow` as the automatic development workflow and `self-evolving` as the post-work learning loop so useful lessons improve project memory, docs, rules, or Skills.
- The agent must evaluate parallel development worktrees, `/best-of-n`, Agent Review, Bugbot, and code audit paths for non-trivial work; high-risk surfaces require review/audit before being accepted.

## Current State

- Critical correctness automation on 2026-05-20 found and fixed a CI verification gap:
  - PR #2 added `scripts/dev-preflight.mjs` to local `verify-full.*`, but GitHub Actions did not run it.
  - `.github/workflows/ion-dex-verify.yml` now runs `node scripts/dev-preflight.mjs` after Node setup and before encoding/build/audit steps.
  - Validation: after installing backend/frontend dependencies, `bash scripts/verify-full.sh` passed with preflight OK, encoding 92 files OK, backend 6 tests passed, backend audit 0 vulnerabilities, backend stress passed, frontend build + Playwright 14 passed, and frontend audit 0 vulnerabilities.
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
- UI design workflow lock added on 2026-05-20:
  - `docs/10-ui-design-route.md` defines the required OKX Web3 / cyberpunk neon / glassmorphism / aurora-galaxy route and page upgrade order.
  - `scripts/dev-preflight.mjs` reads the development iron law, UI Skill, PRD, page flow, UI route, `AGENTS.md`, and `SESSION_STATE.md` before verification continues.
  - `scripts/verify-full.cmd`, `scripts/verify-full.ps1`, and `scripts/verify-full.sh` now run preflight as step 0; agent and save-log verification inherit it.
  - `.cursor/rules/ion-ui-design-workflow.mdc` enforces reading the iron law and UI route before frontend work.
- swap.ion UI conformance completed on 2026-05-20:
  - `.memory-bank/architecture-audit.md` now records UI audit requirements and implementation memory.
  - `frontend/src/components/background/AuroraGalaxyBackground.tsx` uses a Canvas 240-particle aurora/galaxy field on #03050f.
  - `frontend/src/pages/DashboardPage.tsx` is now a `swap.ion` ION Chain DEX surface with glass cards, flowing neon border, three market depth layers, 3D floating chart, and controlled quote math.
  - `frontend/src`, `backend`, and E2E tests were cleared of visible `mock/placeholder/shell/draft/TBD/Build Checklist` wording.
  - Strict preflight, encoding, frontend verify, backend verify/audit/stress, and strict full verify passed.
  - Manual browser validation produced `/opt/cursor/artifacts/swap_ion_ui_conformance_walkthrough.mp4`.
- Trade desk UI continuation completed on 2026-05-20:
  - `frontend/src/pages/BusinessPages.tsx` now renders `TradeDeskPage` outside the generic product module layout.
  - Trade has market stat cards, 3D chart/K-line surface, `TWAP guard active`, right-side Limit order, Order book, Market trades, and Orders and risk.
  - Playwright now has 14 tests including `trade page shows professional desk modules`.
  - Strict preflight, encoding, frontend verify, and strict full verify passed.
  - 100-pass gate completed: `PASSED=100`, `FAILED=0`, `RESULT=GREEN`.
  - Manual browser validation produced `/opt/cursor/artifacts/trade_desk_ui_walkthrough.mp4`.
- User UI correction on 2026-05-20:
  - The true front-end UI target is the provided 4D liquid-glass reference style: aurora/galaxy background, thick cyan/magenta/violet neon rims, glossy translucent cards, irregular rounded glass silhouettes, and 3D feature icons.
  - Flat table-line pages, grey strip controls, tiny compressed typography, and plain engineering forms are design failures even if tests pass.
  - Before claiming UI completion, manually compare rendered screenshots/video against the reference style, not just E2E success.
- User data correction on 2026-05-20:
  - Empty data and pseudo-code are untouchable red lines. They must never be used as product UI content.
  - Loading/error states are allowed only as real request lifecycle states tied to concrete integrations; they cannot hide missing implementation.
  - Product values must come from typed backend/data integrations, source adapters, cache, indexer/upstream APIs, or reviewed local seed data with provenance.
- Overall memory consolidation on 2026-05-20:
  - `.memory-bank/live-data-reference.md`, `.memory-bank/implementation-playbook.md`, and `.memory-bank/overall-design-framework.md` were restored/added from current memory plus Git-history decisions.
  - `scripts/dev-preflight.mjs` now requires the full memory set before verification continues.
  - If a user says a requirement was decided earlier and current memory is incomplete, search Git history before answering or implementing.
  - Right-top avatar is the Profile Hub: avatar, NFT avatar source, wallets, primary wallet, `.ion`, ION ID/KYC, language, theme, privacy, security logs, approvals, orders, grid strategies, staking, bridge history, domains, notifications, referral, badges, and full Profile entry.
- Security audit and stress framework completed on 2026-05-20:
  - `.memory-bank/security-audit-and-stress-framework.md` defines attack defenses, 40 test families, pressure/chaos sandboxes, and code audit procedure.
  - `docs/23-security-audit-and-stress-sandbox.md` turns the framework into an execution checklist and sandbox plan.
  - `scripts/security-preflight.mjs` verifies security memory/docs/skills are present before high-risk work.
  - `scripts/dev-preflight.mjs` now requires the security framework.
- Cursor Automation YAML import completed on 2026-05-20:
  - Added `.cursor/automations/ion-dex-autonomous-build.yml` for the user-requested import path `D:\openclaw-tools\ion-dex-nuke\.cursor\automations\ion-dex-autonomous-build.yml`.
  - Cursor Cloud could not read the Windows `D:\` source path directly, so the template was restored from Git history and updated for the current Linux Cloud Agent flow.
  - `docs/08-ci-agent-automation.md` records the file as a source-of-truth Cursor Automations UI import template.
  - Verification passed: YAML parse `YAML_OK`; encoding scanned 93 files OK; `node scripts/dev-preflight.mjs` OK; `bash scripts/verify-full.sh` OK with backend tests 6 passed, backend audit 0 vulnerabilities, stress smoke passed, frontend Playwright 14 passed, and frontend audit 0 vulnerabilities.

## Current Blocker

Reliable shell execution is confirmed. Memory Bank MCP is loaded. ION official source path is confirmed. No blocker for the automation YAML import; only the pre-existing `package-lock.json` name change remains outside this task.

## Next Action

1. If needed, open/import the automation manually in Cursor Automations using `.cursor/automations/ion-dex-autonomous-build.yml` as the source of truth.
2. Use `cd frontend && npm run dev:local` for frontend runtime verification on `http://localhost:3001/`.
3. Use `D:/openclaw-tools/ion` as the official ION reference source for FunC style, DNS, wallet, multisig, tonlib, lite-client, and API schemes.
4. Use the relevant project skill before each domain task: official source, UI, contract audit, or data backend.
5. Run Agent Review (`/agent-review`) after meaningful diffs and before final verification when available.
6. For every development task, proactively load `.cursor/skills/cursor-engineering-workflow/SKILL.md` and `.cursor/skills/ion-dev-accelerators/SKILL.md` as needed; use `docs/cursor-docs-feature-memory.md` and `docs/development-accelerators-memory.md` as local references.
7. Do not wait for the user to request worktrees, Agent Review, Bugbot, Hooks, MCP, Cloud Agents, CLI automation, Rules, Skills, or verification strategy when they would improve the task.
8. Phase 5 八页业务表单草稿 + E2E：2026-05-18，`scripts/check-encoding.ps1` 已排除本地官方 ION 参考树 `/ion/`（该目录被 `.gitignore` 忽略，不属于本仓源码）；`scripts\verify-100.ps1` 完成 **100-pass**：`PASS 100 OK`，`PASSED=100`，`FAILED=0`，`RESULT=GREEN`。`frontend` `npm run verify` 使用 `start-server-and-test` + **`tcp:127.0.0.1:59333`**，Playwright **`12 passed`**；`audit:high` **`0`**。顶栏导航改为横向滚动可视，修补生产样式下 `hidden lg:flex` 永久隐藏问题。
9. Wallet/Profile shell：2026-05-18，`AppShell` wallet button now opens a local provider picker (Online+ Wallet / ION Browser Wallet / WalletConnect + OKX), drafts a profile session, and supports disconnect without private keys, RPC calls, or signatures. Single full verification after the change: encoding OK, frontend `npm run verify` **13 passed**, `audit:high` **0**. 100-pass gate completed: `PASS 100 OK`, `PASSED=100`, `FAILED=0`, `RESULT=GREEN`.
10. External reference architecture：2026-05-18，`docs/09-reference-architecture.md` added to map the user's reference repositories into ION DEX phases. Key decision: use backend gateway repositories (`tyk`, `shenyu`, `ocelot`) as pattern references only, and start Phase 3 with a minimal typed API gateway/BFF rather than vendoring a full gateway product.
11. Agent capability Skills：2026-05-18，installed project-local Skills `skill-vetter`, `self-evolving`, `tavily`, `find-skill`, `luke-agent-browser-clawdbot`, and `summarize-pro`; registered them in `AGENTS.md` with trigger guidance.
12. Workflow preference：2026-05-18，user explicitly requested making strong use of `self-evolving` and automatic workflow because they help development. Treat `cursor-engineering-workflow` as the pre/during-work operating loop and `self-evolving` as the post-work memory improvement loop.
13. Accelerator/review preference：2026-05-18，user explicitly emphasized that other capabilities are also important, especially parallel development worktrees and code audit/review. For non-trivial work, evaluate worktree isolation and review/audit paths before implementation and before accepting diffs.
14. Claude-Flow/RuFlo：2026-05-18，user required Claude-Flow `3.7.0-alpha.35` / 98-agent capability as installed ability. Package is installed/pinned and CLI works, but RuFlo is not initialized in main, Claude-Flow MCP is not configured in main, WASM agent runtime is missing, and root audit has high/critical findings. Treat as controlled local accelerator, not unrestricted daemon. Project verification after installation passed through `scripts\verify-full-save-log.cmd --no-pause`; root Claude-Flow audit risk remains separate. A sandbox worktree validated minimal init and MCP diagnostics, but showed generated configs require pinning and security review before any main-repo adoption.
15. Next：continue UI correction route by first rebuilding the right-top Profile Hub from `.memory-bank/overall-design-framework.md`, while using `.memory-bank/security-audit-and-stress-framework.md` for wallet/session threat modeling and stress/audit evidence.
16. Automation import follow-up：if the user has a newer local Windows copy of `ion-dex-autonomous-build.yml`, compare it against `.cursor/automations/ion-dex-autonomous-build.yml` before replacing the repository template.

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
