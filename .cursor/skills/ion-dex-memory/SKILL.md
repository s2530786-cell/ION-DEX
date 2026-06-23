---
name: ion-dex-memory
description: Maintains persistent project memory for ION DEX. Use at the start of every ION DEX task, after Cursor restarts, when resuming work, before planning implementation, before editing code, and before final delivery. Reads project state, engineering standards, roadmap, and updates progress so context survives across sessions.
---

# ION DEX Persistent Memory

## Mandatory Startup

Before doing any ION DEX work, read these files in order if they exist:

1. `SESSION_STATE.md`
2. `AGENTS.md`
3. `.cursor/skills/chinese-language/SKILL.md`
4. `docs/00-engineering-standards.md`
5. `.memory-bank/ui-cyber-glass-iron-law.md` (frontend UI color/layout/glass iron law)
6. `.memory-bank/ui-design-master-template.md` + `.memory-bank/design-refs/README.md` (Master design PNG/MP4; gap-analysis workflow)
7. `.memory-bank/overall-design-framework.md`
8. `.memory-bank/live-data-reference.md`
9. `.memory-bank/implementation-playbook.md`
10. `.memory-bank/architecture-audit.md`
11. `.memory-bank/security-audit-and-stress-framework.md`
12. `.memory-bank/ion-dex-nuke/official-source-index.md`
13. `docs/01-product-blueprint.md`
14. `docs/02-technical-architecture.md`
15. `docs/03-development-roadmap.md`
16. `docs/99-current-progress.md`

If these files do not contain a user-confirmed requirement, search Git history before answering or implementing. Do not rely only on current visible files when the user says a decision was made earlier.

If a file is missing, do not assume its contents. Recreate it only when the user asks or when it is necessary to preserve current project memory.

## What To Remember

Always preserve these facts across sessions:

- The product is ION DEX: an OKX Web3 wallet style multi-chain DEX for ION.
- The user requires engineering-grade deliverables, not demos.
- The user wants Simplified Chinese as the default language for communication, planning, testing reports, and delivery summaries.
- All source files must be UTF-8 without BOM, never UTF-16/GBK/ANSI.
- Every created or edited file must be verified for encoding.
- Every implementation step must include test evidence before it is called complete.
- Frontend UI must follow `.memory-bank/ui-cyber-glass-iron-law.md` (cyan `#00FFFF`, purple `#6020FF`, magenta `#FF00FF`, glass blur 18px, Dashboard five-zone layout).
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
