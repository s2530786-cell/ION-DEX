---
name: cursor-engineering-workflow
description: Applies Cursor official-documentation workflows to ION DEX development. Use proactively for every development, verification, review, debugging, workflow, or tooling task to choose the right Cursor mode, Agent Review/Bugbot path, Rules/Skills/MCP/Hooks strategy, Cloud Agent/CLI/SDK automation, safety controls, and verification plan.
---

# Cursor Engineering Workflow

## Purpose

Use this skill proactively to turn Cursor's official capabilities into a practical engineering workflow for ION DEX. The user should not need to ask for this; it is part of the agent's default development responsibility.

Before answering or changing configuration, read:

- `docs/cursor-docs-feature-memory.md`
- `AGENTS.md`
- `SESSION_STATE.md`

## Default Workflow

1. Use Ask mode or read-only exploration for unfamiliar code.
2. Use Plan mode for architecture, contracts, bridge, treasury, backend data, identity, or security work.
3. Use Agent mode only after the scope is clear.
4. Keep changes small and reviewable.
5. Run `/agent-review` after meaningful diffs.
6. Run deterministic verification after edits:
   - encoding check
   - frontend build
   - Playwright E2E
   - high-severity audit
7. For completed feature milestones, run the 100-pass verification gate unless the user explicitly waives it.
8. Update `SESSION_STATE.md` and `docs/99-current-progress.md`.

## Cursor Feature Selection

- Agent: scoped implementation and multi-file edits.
- Plan mode: major design decisions and high-risk tasks.
- Ask mode: read-only codebase understanding.
- Agent Review: local diff review before final verification.
- Bugbot: PR-level bug and security review.
- Rules: persistent project/team instructions.
- Skills: repeatable domain workflows.
- MCP: external tools, memory, browser, databases, APIs, and service integrations.
- Hooks: enforce checks around agent loops, formatting, encoding, secrets, or policy.
- Cloud Agents: isolated parallel work, remote verification, and PR creation.
- CLI: repeatable terminal automation and CI experiments.
- SDK: programmatic agent workflows after local process is stable.

## ION DEX Standards

- Treat asset movement, pricing, fees, treasury, bridge, burn, staking, wallets, DNS, identity, oracle, and AI sentinel logic as security-sensitive.
- Do not rely on Agent Review, Bugbot, or LLM reasoning as the only safety layer.
- Keep terminal and MCP approvals strict for secrets or production systems.
- Never expose private keys, seed phrases, deployer keys, production RPC secrets, or API tokens.
- Prefer least-privilege credentials and local `stdio` MCP for sensitive data.
- Use `BUGBOT.md` as the review rule source for Agent Review and PR review expectations.

## Output Expectations

When this skill is used, answer in Chinese and provide:

- Which Cursor capability should be used.
- Why it fits the current task.
- Required safety controls.
- Required verification.
- Any project files that should be updated.

If exact flags, pricing, API behavior, or security terms matter, re-check the official docs instead of relying only on memory.
