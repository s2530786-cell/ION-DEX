---
name: claude-flow
description: Uses Claude-Flow/RuFlo 3.7.0-alpha.35 as a controlled AI agent orchestration accelerator for planning, multi-agent decomposition, swarm experiments, MCP diagnostics, memory workflows, and code analysis. Use when the user mentions Claude-Flow, RuFlo, 98 AI agents, swarm, hive-mind, autopilot, or agent orchestration.
---

# Claude-Flow / RuFlo

Use this skill to integrate Claude-Flow as a development accelerator, not as an unchecked production dependency.

## Current Project Version

- Package: `claude-flow`
- Required version: `3.7.0-alpha.35`
- CLI observed as: `ruflo v3.7.0-alpha.35`
- License metadata: MIT
- Repository metadata: `https://github.com/ruvnet/claude-flow.git`

## Safe Usage Rules

- Treat this as an alpha-stage orchestration tool.
- Do not run `mcp start`, `start`, `daemon`, `autopilot`, or `init --start-all` unless the task explicitly needs a long-running process.
- Do not initialize Claude-Flow directly in the main repository. Use an isolated Git worktree or disposable sandbox first.
- Do not copy generated `.claude/settings.json` into this repository without review; sandbox initialization enabled hooks and broad command permissions.
- Do not accept generated `.mcp.json` as-is if it uses `ruflo@latest`; pin commands to the approved version before any project integration.
- Prefer read-only diagnostics first:
  - `npx claude-flow@3.7.0-alpha.35 --version`
  - `npx claude-flow@3.7.0-alpha.35 --help`
  - `npx claude-flow@3.7.0-alpha.35 init check`
  - `npx claude-flow@3.7.0-alpha.35 doctor --component version`
  - `npx claude-flow@3.7.0-alpha.35 doctor --component mcp`
- If a command accidentally starts a long-running process, stop it and record the lesson.
- Do not expose private keys, seed phrases, production RPC URLs, deployer credentials, API tokens, cookies, or wallet material to Claude-Flow agents.
- Do not let Claude-Flow bypass ION DEX verification gates, Agent Review, Bugbot, contract audit, or deterministic tests.

## Security Status

`npm audit --audit-level=high` against the root install currently reports high/critical transitive vulnerabilities. Use Claude-Flow only as a controlled local development accelerator until those are resolved or explicitly accepted for isolated use.

## Sandbox Findings

A minimal sandbox initialization with `--minimal --skip-claude --no-global` still created:

- `CLAUDE.md`
- `.claude/settings.json`
- `.claude/skills/*`
- `.claude-flow/config.yaml`
- `.mcp.json`

Diagnostics after sandbox init:

- `init check`: initialized.
- `doctor --component mcp`: 1 `ruflo` MCP server configured.
- `agent list`: no active agents.
- ONNX local inference unavailable unless additional runtime packages are installed.
- Default generated config used `maxAgents: 5`, not 98.

## When To Use

- Break a large feature into parallel UI/backend/contract/verification work streams.
- Explore competing designs before implementation.
- Analyze change risk before editing.
- Coordinate local swarm experiments in an isolated worktree.
- Inspect MCP/tooling status.

## When Not To Use

- Production deployments.
- Signing, wallet, bridge, fee, treasury, staking, burn, DNS, or contract execution.
- Any workflow involving secrets or live assets.
- Verification replacement; it can assist planning, not replace tests.
