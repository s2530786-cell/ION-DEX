# AGENTS.md

## ION DEX Agent Instructions

This repository must be treated as an engineering-grade production project.

## Required Skill

Before working on this project, load and follow:

- `.cursor/skills/chinese-language/SKILL.md`
- `.cursor/skills/ion-dex-memory/SKILL.md`
- `.cursor/skills/ion-official-source/SKILL.md` when touching ION-native contracts, DNS, wallets, tonlib, lite-client, or official source references.
- `.cursor/skills/ion-web3-ui/SKILL.md` when touching frontend UI, React, Tailwind, pages, dashboard, wallet/profile, or Playwright UI tests.
- `.cursor/skills/ion-contract-audit/SKILL.md` when touching FunC, Solidity, AMM, staking, burn, bridge, vault, treasury, fee, oracle, or sentinel logic.
- `.cursor/skills/ion-data-backend/SKILL.md` when touching CMC, DNS, burn, staking, bridge, treasury, API, indexer, database, cache, or backend data flows.
- `.cursor/skills/cursor-engineering-workflow/SKILL.md` for every development, verification, review, debugging, workflow, or tooling task. The agent must proactively decide the right Cursor mode, review path, safety controls, and verification path without waiting for the user to ask.
- `.cursor/skills/ion-dev-accelerators/SKILL.md` for every development task. The agent must proactively consider Git worktrees, Cursor `/worktree`, `/best-of-n`, Hooks, Agent Review, Bugbot, Cloud Agents, Cursor CLI, CI automation, MCP tools, Rules, and Skills when they would improve speed, isolation, or safety.
- `.cursor/skills/skill-vetter/SKILL.md` when installing, editing, reviewing, or trusting Agent Skills.
- `.cursor/skills/find-skill/SKILL.md` when locating available Skills or deciding whether a requested Skill already exists.
- `.cursor/skills/self-evolving/SKILL.md` after major tasks, repeated failures, or user corrections that should update project memory.
- `.cursor/skills/tavily/SKILL.md` when doing current web/repository/documentation research; use available search fallbacks if Tavily itself is not configured.
- `.cursor/skills/luke-agent-browser-clawdbot/SKILL.md` when validating or debugging frontend behavior through browser automation.
- `.cursor/skills/summarize-pro/SKILL.md` when summarizing long docs, logs, transcripts, diffs, research results, or verification output.
- `.cursor/skills/claude-flow/SKILL.md` when using Claude-Flow/RuFlo for AI agent orchestration, swarm planning, MCP diagnostics, multi-agent decomposition, or controlled local agent experiments.

## Core Requirements

- **Official source iron law:** `ice-blockchain/*` official codebases and `docs/ion-official-canonical-addresses.md` are the standard. Before writing bridge/burn/wallet/token logic, read the official repo or shared constants; **do not invent** flows or addresses when official material exists. Confirmed BSC: ION `0xe1ab61f7b093435204df32f5b3a405de55445ea8`, burn `0x000000000000000000000000000000000000dEaD`.
- Source encoding: UTF-8 without BOM only.
- Communicate with the user in Simplified Chinese by default.
- Before any development work, read `docs/00-engineering-standards.md` as the development iron law.
- Before any implementation or UI claim, retrieve `.memory-bank/overall-design-framework.md`, `.memory-bank/live-data-reference.md`, `.memory-bank/implementation-playbook.md`, `.memory-bank/architecture-audit.md`, and `.memory-bank/ion-dex-nuke/official-source-index.md`; search Git history when current memory appears incomplete.
- Before security-sensitive work, also retrieve `.memory-bank/security-audit-and-stress-framework.md`, read `docs/23-security-audit-and-stress-sandbox.md`, and run `node scripts/security-preflight.mjs` when shell access is available.
- Before frontend/UI work, read `docs/10-ui-design-route.md` and run `node scripts/dev-preflight.mjs` when shell access is available.
- After every frontend/UI task completes, deliver a UI visual self-audit report per `docs/11-ui-visual-self-audit-gate.md` (template: `docs/templates/ui-visual-self-audit-TEMPLATE.md`). Engineering verify green does not replace this report.
- Never create UTF-16, GBK, ANSI, or BOM files.
- Verify encoding after every file write.
- Do not claim completion without build/test/lint/security evidence.
- Agent Review must follow `BUGBOT.md` for ION DEX review focus and output style.
- It is the agent's responsibility to proactively use Cursor engineering workflows and development accelerators during development; the user should not need to ask for them.
- It is the agent's responsibility to use `cursor-engineering-workflow` before and during development to choose mode, tooling, safety controls, and verification; use `self-evolving` after major work, failures, and user corrections to improve project memory, docs, rules, or Skills.
- It is the agent's responsibility to evaluate parallel development accelerators for every non-trivial task: use Git worktrees/Cursor `/worktree` for isolated UI/backend/contract/verification streams, `/best-of-n` for competing designs, Agent Review for meaningful local diffs, and Bugbot for PR-level review.
- Code audit and review are mandatory for high-risk surfaces: contracts, bridge, wallet/session, fees, treasury, staking, burn, DNS, backend data APIs, auth, caching, deployment, and verification scripts.
- Claude-Flow/RuFlo is allowed only as a controlled local development accelerator. Because `claude-flow@3.7.0-alpha.35` currently has high/critical transitive audit findings, do not start long-running Claude-Flow MCP/daemon/autopilot processes or expose secrets/assets without an explicit isolated task and verification plan.
- Before continuing feature development after a completed change, the project must pass 100 full green verification runs unless the user explicitly waives this gate for a narrow investigation.
- If tools cannot run commands, ask the user to run the exact command and paste output.
- Search for working MCP/tooling before accepting a tool limitation.

## Product Direction

ION DEX is planned as an OKX Web3 wallet style DEX for ION with:

- Swap, professional spot trading, limit orders, and grid strategies.
- ION fee collection, burn allocation, staking rewards, treasury, and team allocation logic.
- BSC and ION Chain burn analytics.
- Liquidity mining and dynamic staking rates.
- Cross-chain bridge architecture.
- ION DNS/domain marketplace and wallet binding.
- ION ID / KYC pass integration.
- User profile, avatars, language preferences, Online+ wallet, ION browser wallet, and mainstream Web3 wallets.
- AI market analysis and on-chain risk monitoring.

## Development Process

1. Read `SESSION_STATE.md`.
2. Read `docs/00-engineering-standards.md` before any development, then retrieve all current memory-bank design/data guides:
   - `.memory-bank/overall-design-framework.md`
   - `.memory-bank/live-data-reference.md`
   - `.memory-bank/implementation-playbook.md`
   - `.memory-bank/architecture-audit.md`
   - `.memory-bank/security-audit-and-stress-framework.md`
   - `.memory-bank/ion-dex-nuke/official-source-index.md`
3. If the current memory bank does not contain a previously discussed detail, search Git history before answering or implementing.
4. Read current engineering docs under `docs/`.
5. For every development task, proactively load the Cursor workflow and development accelerator context:
   - `docs/cursor-docs-feature-memory.md`
   - `docs/development-accelerators-memory.md`
6. For frontend/UI tasks, read `docs/10-ui-design-route.md` and run `node scripts/dev-preflight.mjs` before implementation; full verification scripts run this automatically as step 0.
7. Apply `cursor-engineering-workflow` as the active automatic workflow for planning, mode choice, review path, MCP/tool selection, and verification strategy.
8. Apply `ion-dev-accelerators` before implementation to decide whether worktrees, `/best-of-n`, Agent Review, Bugbot, Hooks, Cloud Agents, CLI automation, MCP, Rules, or Skills should be used.
9. For multi-stream or high-risk work, prefer isolated Git worktrees/Cursor `/worktree` with separate ports and scoped branches; do not mix unrelated UI, backend, contract, and verification experiments in one working tree when isolation would reduce risk.
10. Run code review/audit paths before accepting meaningful diffs: Agent Review for local diffs when available, Bugbot for PRs, and domain-specific audit Skills for contract/backend/security-sensitive changes.
11. **Do not ask the user for permission before every tiny step.** For scoped edits (UX copy, tests, wiring, bugfixes), implement continuously and validate yourself. Ask only when requirements are ambiguous, secrets/credentials are missing, or an action is destructive and irreversible without explicit consent.
12. Implement in coherent chunks; batch related file edits rather than blocking on human “continue” between each line.
13. After substantive code edits, **automatically** run verification—use `scripts\agent-verify.cmd` (non-interactive, no `pause`) or `ION_VERIFY_NONINTERACTIVE=1` with `scripts\verify-full.cmd`. Use `scripts\verify-full-save-log.cmd --no-pause` if stdout may be empty, then read `%TEMP%\ion-verify-full.txt`. Only ask the user to run commands when the agent environment cannot execute shells.
14. After major work, repeated failures, verification fixes, or user corrections, apply `self-evolving` to capture lessons and update `SESSION_STATE.md`, `docs/99-current-progress.md`, relevant Skills, or `AGENTS.md` when useful.
15. For feature work, run the 100-pass verification gate before moving on to the next feature unless the user waives it.
16. Update `docs/99-current-progress.md` and `SESSION_STATE.md`.

See also `docs/08-ci-agent-automation.md` for GitHub Actions and optional Cursor hooks.

## Cursor Cloud specific instructions

### Services overview

| Service | Command | Port | Notes |
|---------|---------|------|-------|
| Frontend (Vite + React) | `cd frontend && npm run dev` | 3000 | `npm run dev:local` uses 127.0.0.1:3001 |
| Backend (Node.js) | `cd backend && npm run build && npm run start` | 8787 | Must build before starting; mock data only |

No Docker, PostgreSQL, Redis, or external services required at this stage.

### Running tests

- **Backend unit tests**: `cd backend && npm run build && npm run test` (6 tests via `node --test`)
- **Frontend build**: `cd frontend && npm run build` (runs `tsc && vite build`)
- **E2E tests**: `cd frontend && PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 npx playwright test` (13 Playwright smoke tests; requires Chromium installed via `npx playwright install --with-deps chromium` and a running frontend server)
- **Full verify** (build + E2E): `cd frontend && npm run verify` (builds first, then spawns a preview server on a random port)
- **Encoding check**: `bash scripts/check-encoding.sh`
- **Audit**: `cd frontend && npm audit --audit-level=high` and `cd backend && npm audit --audit-level=high`

### Non-obvious caveats

- The verification scripts (`scripts/*.cmd`, `scripts/*.ps1`) are Windows-oriented. On Linux Cloud Agent VMs, use the bash equivalent commands directly or the `check-encoding.sh` script.
- Running `npx playwright test` directly (without `npm run verify`) requires either a running dev server or setting `PLAYWRIGHT_BASE_URL`. The default Playwright config targets port 59333, which is only started by the `verify-e2e.mjs` helper script.
- The root `package.json` only contains `claude-flow` as a devDependency (AI orchestration tool with known audit findings). It is not needed for running the app or tests.
- `frontend/package.json` uses `latest` tags for many dependencies. `npm install` may resolve different versions across sessions; if E2E tests break after a fresh install, check for breaking upstream changes.
- The backend must be built (`npm run build`) before it can be started or tested — there is no `ts-node` or similar dev runner.
