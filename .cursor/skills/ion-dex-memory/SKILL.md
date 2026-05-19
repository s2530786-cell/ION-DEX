---
name: ion-dex-memory
description: Maintains persistent project memory for ION DEX. Use at the start of every ION DEX task, after Cursor restarts, when resuming work, before planning implementation, before editing code, and before final delivery. Reads project state, engineering standards, roadmap, and updates progress so context survives across sessions.
---

# ION DEX Persistent Memory

## Mandatory Startup

### 🔴 THREE RED LINES — Read Before Touching Any File
> **Master 2026-05-19. Violation = permanent distrust.**

1. **NO LYING** — Don't claim work done without evidence (logs/screenshots/output).
2. **NO FAKE/MOCK CODE** — Every interface connects to real chain data. No `return { price: 0.42 }`. Can't build real? Don't build.
3. **NO GARBLED CHINESE** — All files UTF-8 no BOM. 锟斤拷/烫烫烫 = unusable = don't commit.

### Iron law preflight (never skip)

Before doing any ION DEX work — **especially before editing code** — read these files in order if they exist:

0. `.memory-bank/architecture-audit.md` — **TASK 0: 24-item audit + P0→P3 priority + Agent Build Order checkbox**
1. `.memory-bank/README.md`
2. `.memory-bank/ai-red-lines.md` — no lying, no empty/mock-as-real data, encoding self-check
3. `.memory-bank/development-iron-law-preflight.md` — dual-chain 1500 audit, stress, verify-100, dev loop
4. `.cursor/rules/ion-dex-iron-law.mdc` (workspace iron law; auto-loaded but must be internalized)
5. `.cursor/rules/ion-autonomous-verify.mdc`
6. `.cursor/rules/12-factor-agents.mdc`

### Project state

7. `SESSION_STATE.md`
8. `docs/99-current-progress.md`
9. `AGENTS.md`
10. `.cursor/skills/chinese-language/SKILL.md`
11. `.memory-bank/architecture-audit.md` — first unchecked P0 task

### Architecture docs (read when touching that layer)

12. `docs/03-technical-architecture.md` — contracts / DB / API
13. `docs/08-ci-agent-automation.md` — steps 0–9, hooks, verify commands

Optional legacy roadmap files: `docs/00-engineering-standards.md`, `docs/01-product-blueprint.md`, `docs/03-development-roadmap.md` — only if the current task references them.

If a file is missing, do not assume its contents. Recreate it only when the user asks or when it is necessary to preserve current project memory.

## Security verification memory (2026-05-19)

- **ION chain:** `scripts/func-security-audit.mjs` — 15 categories × 100 = 1500 green; plus `scripts/func-contract-test.mjs`.
- **BSC chain:** `contracts/bsc/test/SecurityAttackTest.t.sol` — 15 × 100 = 1500 including **quantum resistance** (category 15).
- **Both chains:** `scripts/dual-chain-audit.mjs` after every contract change.
- **100-pass gates:** `scripts/verify-100.ps1` (full stack + Playwright E2E); `scripts/verify-100-dual-chain.ps1` (dual-chain only). May run in parallel.
- **Stress:** `backend/npm run stress`; heavy via `ION_STRESS_PROFILE=heavy` in `scripts/iron-law-security.cmd`.
- **Rule:** 1499 green + 1 red = FAIL. Do not claim completion without command evidence.

## What To Remember

Always preserve these facts across sessions:

- The product is ION DEX: an OKX Web3 wallet style multi-chain DEX for ION.
- The user requires engineering-grade deliverables, not demos.
- The user wants Simplified Chinese as the default language for communication, planning, testing reports, and delivery summaries.
- All source files must be UTF-8 without BOM, never UTF-16/GBK/ANSI.
- Every created or edited file must be verified for encoding.
- Every implementation step must include test evidence before it is called complete.
- Frontend UI must follow the confirmed neon/futuristic/aurora/galaxy design direction.
- Smart contracts must follow strict audit discipline: reentrancy, access control, oracle manipulation, MEV, multisig, timelock, gas, events, fuzzing, and formal specs where possible.
- Backend, contracts, frontend, deployment, testing, and security are all part of the final deliverable.
- Do not claim shell/build/test success without actual command output or user-provided output.

## Update Rules

After every meaningful change, update `docs/99-current-progress.md` with:

- What changed
- Files touched
- Tests run
- Test result
- Known issues
- Next step

At the end of each session, update `SESSION_STATE.md` with:

- Last completed step
- Current blocker
- Exact next action
- Commands the user must run if shell is unavailable
- Important decisions made in the session

## Encoding self-check (mandatory after every write)

Chinese or punctuation in `.md` / `.mdc` / comments must not ship with mojibake.

**After creating or editing any file with Chinese:**

1. Save as **UTF-8 without BOM** only.
2. Scan the diff for known garbage: `鈫?`, `鈥?`, `鉁?`, `鉂?`, `馃`, `脳`, `?? ` (broken heading), `鏃鸿储` (wrong name).
3. Use normal punctuation: `—` (em dash), `→` (arrow), `×` (multiply), with a space after when followed by a word (e.g. `— 完成`, not `—完成`).
4. Run `powershell -File scripts\check-encoding.ps1` when the shell is available; fix before claiming done.

**Optional repair:** `node scripts/fix-architecture-audit-encoding.mjs` for `.memory-bank/architecture-audit.md` spacing drift.

## Verification Rules

Before final response for implementation work:

1. Read back all newly created/edited files.
2. Confirm encoding check was run or explicitly say it could not be run.
3. Confirm build/test/lint status or explicitly say it could not be run.
4. List remaining risks honestly.

## External Tooling

If the normal Shell tool is unavailable on Windows, prefer installing and using:

- Desktop Commander MCP for real command execution.
- Memory Bank MCP for durable memory.
- Playwright MCP or browser automation for UI verification.

Do not stop at a tool limitation. Search for a working MCP/tool path first.
