# ION DEX Memory Bank

This directory is the durable MCP memory root for ION DEX.

It stores project decisions, progress notes, architecture constraints, and delivery evidence across Cursor restarts.

Primary persistent files outside this memory bank:

- `SESSION_STATE.md`
- `AGENTS.md`
- `.cursor/skills/ion-dex-memory/SKILL.md`
- `docs/99-current-progress.md`

Hard rule: memory content is project context only. Never store private keys, API secrets, seed phrases, passwords, or production credentials here.
