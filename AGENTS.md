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

## Core Requirements

- Source encoding: UTF-8 without BOM only.
- Communicate with the user in Simplified Chinese by default.
- Never create UTF-16, GBK, ANSI, or BOM files.
- Verify encoding after every file write.
- Do not claim completion without build/test/lint/security evidence.
- Agent Review must follow `BUGBOT.md` for ION DEX review focus and output style.
- It is the agent's responsibility to proactively use Cursor engineering workflows and development accelerators during development; the user should not need to ask for them.
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
2. Read current engineering docs under `docs/`.
3. For every development task, proactively load the Cursor workflow and development accelerator context:
   - `docs/cursor-docs-feature-memory.md`
   - `docs/development-accelerators-memory.md`
4. **Do not ask the user for permission before every tiny step.** For scoped edits (UX copy, tests, wiring, bugfixes), implement continuously and validate yourself. Ask only when requirements are ambiguous, secrets/credentials are missing, or an action is destructive and irreversible without explicit consent.
5. Implement in coherent chunks; batch related file edits rather than blocking on human “continue” between each line.
6. After substantive code edits, **automatically** run verification—use `scripts\agent-verify.cmd` (non-interactive, no `pause`) or `ION_VERIFY_NONINTERACTIVE=1` with `scripts\verify-full.cmd`. Use `scripts\verify-full-save-log.cmd --no-pause` if stdout may be empty, then read `%TEMP%\ion-verify-full.txt`. Only ask the user to run commands when the agent environment cannot execute shells.
7. For feature work, run the 100-pass verification gate before moving on to the next feature unless the user waives it.
8. Update `docs/99-current-progress.md` and `SESSION_STATE.md`.

See also `docs/08-ci-agent-automation.md` for GitHub Actions and optional Cursor hooks.
