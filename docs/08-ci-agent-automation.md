# CI and agent automation

## Goal

Run the same verification humans use, **without** interactive `pause`, so agents and CI do not block waiting for keyboard input.

## Commands

| Scenario | Command |
|----------|---------|
| Agent / CI / hooks (no pause) | `scripts\agent-verify.cmd` |
| Save full log to `%TEMP%\ion-verify-full.txt`, optional pause at end | `scripts\verify-full-save-log.cmd` |
| Save log, never pause | `scripts\verify-full-save-log.cmd --no-pause` |
| Interactive debugging with pause on failure | `scripts\verify-full.cmd` (no `CI` / no `ION_VERIFY_NONINTERACTIVE`) |

Environment variables recognised by `scripts\verify-full.cmd`:

- `CI` — skip all pauses (GitHub Actions sets this).
- `ION_VERIFY_NONINTERACTIVE=1` — skip all pauses (used by `agent-verify.cmd`).

## GitHub Actions

Workflow: `.github/workflows/ion-dex-verify.yml`

Runs on every **push** and **pull_request**, plus manual **workflow_dispatch**: encoding check, `npm ci`, Playwright Chromium, `npm run verify`, `npm run audit:high`. The workflow targets `frontend/` at repo root (same layout after syncing `frontend/` next to `ion/`).

## Cursor Hooks (optional)

Full Playwright on **every** agent stop is slow. Prefer letting the agent run `scripts\agent-verify.cmd` after edits.

If you still want an automatic run when an agent turn ends:

1. Copy `docs/cursor-hooks-verify-stop.sample.json` to `.cursor/hooks.json` (merge with your existing hooks if any).
2. Ensure `.cursor/hooks/ion-verify-on-stop.cmd` exists (already in repo).

`failClosed` is `false` so a failed verify does not brick the IDE; check the Hooks output channel or the exit code in logs.
