---
name: ion-dev-accelerators
description: Selects and applies development accelerators for ION DEX, including Git worktrees, Cursor /worktree, /best-of-n, Hooks, Agent Review, Bugbot, Cloud Agents, Cursor CLI, CI automation, MCP tools, Rules, and Skills. Use proactively for every development task to improve speed, isolation, review quality, and safety without waiting for the user to ask.
---

# ION Development Accelerators

## Responsibility

Use this skill proactively during development. The agent must decide whether worktrees, best-of-n, hooks, reviews, Cloud Agents, CLI automation, MCP, Rules, or Skills would improve the current task.

## Required Reading

Before recommending or configuring accelerators, read:

- `docs/development-accelerators-memory.md`
- `docs/cursor-docs-feature-memory.md`
- `AGENTS.md`
- `SESSION_STATE.md`

## Selection Rules

- Need isolated parallel work: use Git worktree or Cursor `/worktree`.
- Need multiple candidate solutions: use `/best-of-n`.
- Need repeatable safety checks: use Hooks plus deterministic scripts.
- Need local diff review: use `/agent-review`.
- Need PR review: use Bugbot.
- Need remote isolated execution: use Cloud Agents.
- Need terminal or CI automation: use Cursor CLI with restricted permissions.
- Need external data/tools: use MCP with least-privilege credentials.
- Need reusable domain workflow: create or update a Skill.
- Need persistent behavioral constraint: create or update Rules or `AGENTS.md`.

## ION DEX Guardrails

- Never weaken verification to gain speed.
- Keep worktree branches scoped by domain: UI, contracts, backend/data, verification.
- Do not share dev server ports across worktrees.
- Do not expose private keys, seed phrases, production RPC URLs, deployer credentials, or API tokens.
- Prefer read-only MCP tools before write-capable tools.
- Require Agent Review and deterministic verification before merging isolated work.
- For completed feature milestones, run the 100-pass verification gate unless explicitly waived.

## Output Format

When this skill is used, answer in Chinese with:

- Recommended accelerator.
- Why it helps.
- How to use it in this project.
- Risks and guardrails.
- Verification required before accepting the result.
