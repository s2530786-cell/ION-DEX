# ION DEX Memory Bank

This directory is the durable MCP memory root for ION DEX.

It stores project decisions, progress notes, architecture constraints, and delivery evidence across Cursor restarts.

Primary persistent files outside this memory bank:

- `SESSION_STATE.md`
- `AGENTS.md`
- `.cursor/skills/ion-dex-memory/SKILL.md`
- `docs/99-current-progress.md`

## UI iron law (frontend)

- **`ui-cyber-glass-iron-law.md`** — Master-locked cyber aurora glass UI: colors, layout, CSS classes, Cursor prompt, pitfalls.
- **`ui-design-master-template.md`** — design PNG/MP4 index, screen→code map, gap-analysis workflow, 100% acceptance checklist.
- **`design-refs/`** — Master PNG screens, boot MP4 masters, brand logo (`screens/`, `boot/`, `brand/`).
- **`docs/cursor-prompt-ion-ui-1to1.md`** — copy-paste prompt for Cursor chats.
- **`.cursor/rules/ion-cyber-glass-iron-law.mdc`** — applies when editing `frontend/**`.

Hard rule: memory content is project context only. Never store private keys, API secrets, seed phrases, passwords, or production credentials here.
