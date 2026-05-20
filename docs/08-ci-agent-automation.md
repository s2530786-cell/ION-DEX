# CI and agent automation

## Goal

Run the same verification humans use, **without** interactive `pause`, so agents and CI do not block waiting for keyboard input.

## Commands

| Scenario | Command |
|----------|---------|
| Development preflight only | `node scripts/dev-preflight.mjs` |
| Agent / CI / hooks (no pause) | `scripts\agent-verify.cmd` |
| Save full log to `%TEMP%\ion-verify-full.txt`, optional pause at end | `scripts\verify-full-save-log.cmd` |
| Save log, never pause | `scripts\verify-full-save-log.cmd --no-pause` |
| Interactive debugging with pause on failure | `scripts\verify-full.cmd` (no `CI` / no `ION_VERIFY_NONINTERACTIVE`) |
| POSIX Cloud Agent full verification | `bash scripts/verify-full.sh` |

Environment variables recognised by `scripts\verify-full.cmd`:

- `CI` — skip all pauses (GitHub Actions sets this).
- `ION_VERIFY_NONINTERACTIVE=1` — skip all pauses (used by `agent-verify.cmd`).
- `ION_UI_STRICT=1` — turns current unfinished UI copy warnings from `scripts/dev-preflight.mjs` into failures.

`scripts\verify-full.cmd`, `scripts\verify-full.ps1`, `scripts\verify-full.sh`, `scripts\agent-verify.cmd`, and `scripts\verify-full-save-log.cmd --no-pause` run `node scripts/dev-preflight.mjs` before the encoding check.

## GitHub Actions

Workflow: `.github/workflows/ion-dex-verify.yml`

Runs on every **push** and **pull_request**, plus manual **workflow_dispatch**: encoding check, `npm ci`, Playwright Chromium, `npm run verify`, `npm run audit:high`. The workflow targets `frontend/` at repo root (same layout after syncing `frontend/` next to `ion/`).

## Cursor Automation template

Template: `.cursor/automations/ion-dex-autonomous-build.yml`

The template records the autonomous build prompt requested from `D:\openclaw-tools\ion-dex-nuke\.cursor\automations\ion-dex-autonomous-build.yml`. Cursor Cloud cannot mount that Windows path directly, so the repository template was restored from Git history and adapted to the current Linux Cloud Agent flow: read project memory, run `node scripts/dev-preflight.mjs`, run `bash scripts/verify-full.sh` after edits, update progress memory, commit only scoped task files, and avoid secrets or destructive git commands.

Current Cursor documentation indexed in this repo describes Automations as configured through the Cursor Automations UI. Treat this YAML as a source-of-truth import template for copying into `cursor.com/automations` until Cursor exposes a stable repository YAML import schema.

## Cursor Hooks (optional)

Full Playwright on **every** agent stop is slow. Prefer letting the agent run `scripts\agent-verify.cmd` after edits.

If you still want an automatic run when an agent turn ends:

1. Copy `docs/cursor-hooks-verify-stop.sample.json` to `.cursor/hooks.json` (merge with your existing hooks if any).
2. Ensure `.cursor/hooks/ion-verify-on-stop.cmd` exists (already in repo).

`failClosed` is `false` so a failed verify does not brick the IDE; check the Hooks output channel or the exit code in logs.
