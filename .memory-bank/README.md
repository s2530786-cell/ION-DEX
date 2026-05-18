# ION DEX Memory Bank

This directory is the durable MCP memory root for ION DEX.

It stores project decisions, progress notes, architecture constraints, and delivery evidence across Cursor restarts.

Primary persistent files outside this memory bank:

- `SESSION_STATE.md`
- `AGENTS.md`
- `.cursor/skills/ion-dex-memory/SKILL.md`
- `docs/99-current-progress.md`

Hard rule: memory content is project context only. Never store private keys, API secrets, seed phrases, passwords, or production credentials here.

## Master's Permanent Rules（Master 钦定，永不覆盖）

These rules are permanent. No agent or developer may remove or weaken them.

1. **Strict architecture compliance**: All code must match `docs/03-technical-architecture.md` + `docs/04-development-roadmap.md` + `docs/05-product-prd.md`. Every feature must trace back to a design doc.

2. **Blockchain audit company standard**: Contracts must pass CertiK/Trail of Bits/OpenZeppelin-level review. Full 10-point security checklist from `.cursor/skills/ion-contract-audit/SKILL.md` on every change.

3. **Fix vulnerabilities immediately**: Zero tolerance for security issues. Compiler warnings, lint errors, audit findings → fix before continuing. No TODO-skipping security problems.

4. **100-pass gate, 100/100 GREEN**: `scripts/verify-100.ps1` → `PASS 100/100, FAILED=0, RESULT=GREEN, exit 0`. No fewer rounds, no yellow, no red, no excuses.

5. **Commit every step**: One contract / service / page → one clear git commit. Full traceability.

6. **Full auto-workflow, never wait to be asked**: Agent must self-drive. Detect task → auto-load Skill → auto-execute → auto-verify → auto-report. User should never need to trigger individual steps.

7. **Search GitHub, download dependencies**: Missing a tool? GitHub is first search source. Find open-source libs (≥50 ⭐) → download → install deps → integrate → verify it runs. Complete install is the only standard.

8. **Vet every Skill before install**: Run `.cursor/skills/skill-vetter/SKILL.md` on every new skill. Check permissions, dangerous patterns, external requests. Red flags → refuse install, report to Master.

9. **Use all installed Cursor capabilities**: Worktrees, Agent Review, Bugbot, Cloud Agents, Hooks, CI, MCP tools (Desktop Commander, Memory Bank), Rules, Skills — use them all. Pick the optimal path automatically.
