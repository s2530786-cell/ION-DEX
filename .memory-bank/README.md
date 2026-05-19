# ION DEX Memory Bank

This directory is the durable MCP memory root for ION DEX.

It stores project decisions, progress notes, architecture constraints, and delivery evidence across Cursor restarts.

Primary persistent files outside this memory bank:

- `SESSION_STATE.md`
- `AGENTS.md`
- `.cursor/skills/ion-dex-memory/SKILL.md`
- `docs/99-current-progress.md`

Hard rule: memory content is project context only. Never store private keys, API secrets, seed phrases, passwords, or production credentials here.

## AI 触碰红线（Master 钦定 — 最高优先级）

完整条文： **`.memory-bank/ai-red-lines.md`**

1. **严禁撒谎** — 没干就不能说干了；汇报必须带命令/文件/exit code 证据。  
2. **禁止空代码、空数据** — 必须对应真实链上数据与真实功能；mock 必须显式标注。  
3. **写完必自查** — UTF-8 无 BOM、无中文乱码、跑 `check-encoding` + 分层验证后再声称完成。

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

## Session startup order（每次起手读什么）

**写任何代码之前** 必须先完成「开发铁律预检」：

1. **`.memory-bank/README.md`** — Master permanent rules + this file list.  
2. **`.memory-bank/ai-red-lines.md`** — **必读**：严禁撒谎、禁止空数据、编码自查。  
3. **`.memory-bank/development-iron-law-preflight.md`** — **必读**：双链 1500 审计、压力测试、100 绿、验证命令、开发循环。  
4. **`.cursor/rules/ion-dex-iron-law.mdc`** — 15 类攻击 × 100、防量子、零垃圾。  
5. **`docs/99-current-progress.md`** — authoritative delivery + last verify evidence.  
6. **`SESSION_STATE.md`** — long-form session narrative / Next Action backlog.  
7. **Automation:** **`docs/08-ci-agent-automation.md`**（步 0–9 + Hooks）。

Agent Skill **`.cursor/skills/ion-dex-memory/SKILL.md`** 与本节同步；不得跳过铁律预检直接改仓库。

## Dual-chain security audit（ION + BSC）

| Chain | Gate | Command |
|-------|------|---------|
| ION FunC | 1500 static + compile | `node scripts\func-security-audit.mjs` |
| BSC Solidity | 1500 Foundry | `forge test --match-contract SecurityAttackTest` |
| Both | One shot | `node scripts\dual-chain-audit.mjs` |
| + stress | API load | `scripts\iron-law-security.cmd` |

## Automated verify commands（仓库根）

| Goal | Command |
|------|---------|
| Agent / hook / CI (no pause) | `scripts\agent-verify.cmd` |
| Full log to `%TEMP%\ion-verify-full.txt` | `scripts\verify-full-save-log.cmd --no-pause` |
| 100 green full stack + E2E | `scripts\verify-100.ps1 -Iterations 100` |
| 100 green dual-chain only | `scripts\verify-100-dual-chain.ps1 -Iterations 100` |
| Single dual-chain audit | `node scripts\dual-chain-audit.mjs` |

Each `verify-100` step retries Windows transient `-1073741502` once. `backend-stress` also retries once on any failure.

## Scheduled automation (local + CI)

| Layer | Entry |
|-------|--------|
| Windows tasks | `scripts\register-windows-scheduled-tasks.ps1` |
| Manual mode gate | `ION_AUTO_MODE=standard` + `scripts\automation-scheduled-gate.cmd` |
| 100-pass background | `scripts\start-verify-100-background.cmd` |
| GitHub daily | `.github/workflows/ion-dex-scheduled-gates.yml` |
| Details | `.memory-bank/development-iron-law-preflight.md` §8 |
