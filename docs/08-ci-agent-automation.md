# CI and agent automation

## Session startup — read memory before coding

Agents should hydrate context in this order:

1. **`.memory-bank/README.md`** — permanent Master rules + file index.  
2. **`docs/99-current-progress.md`** — authoritative progress and last verification evidence.  
3. **`SESSION_STATE.md`** — narrative / backlog (may drift; reconcile against `docs/99`).  

After substantive edits: **`scripts\agent-verify.cmd`** or **`scripts\verify-full-save-log.cmd --no-pause`** (non-interactive). Cursor **stop** hook runs **`ion-verify-on-stop.cmd`** (FunC probe + **`agent-verify`**) unless disabled.

## Goal

Run the same verification humans use, **without** interactive `pause`, so agents and CI do not block waiting for keyboard input.

## Commands

| Scenario | Command |
|----------|---------|
| Agent / CI / hooks (no pause) | `scripts\agent-verify.cmd` |
| Save full log to `%TEMP%\ion-verify-full.txt`, optional pause at end | `scripts\verify-full-save-log.cmd` |
| Save log, never pause | `scripts\verify-full-save-log.cmd --no-pause` |
| Interactive debugging with pause on failure | `scripts\verify-full.cmd` (no `CI` / no `ION_VERIFY_NONINTERACTIVE`) |
| 100 sequential green gates (long) | `powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-100.ps1` |

Environment variables recognised by `scripts\verify-full.cmd`:

- `CI` — skip all pauses (GitHub Actions sets this).
- `ION_VERIFY_NONINTERACTIVE=1` — skip all pauses (used by `agent-verify.cmd`).

### `verify-100.ps1` retries (Windows transient exit)

[`scripts\verify-100.ps1`](../scripts/verify-100.ps1) wraps each phase (`encoding`, `backend-verify`, backend audit/stress, `frontend-verify`, frontend audit) in **`Run-StepResilient`**. If a step exits with **`-1073741502`** (native **`0xC0000142`**, **`STATUS_DLL_INIT_FAILED`**, often seen from nested `cmd`/`npm`), the script logs it and **re-runs that same step once** before failing the entire pass block.

If the embedded Cursor terminal still flakes on long gates, launch **`scripts\verify-100.ps1`** from a **standalone `cmd.exe` or Windows Terminal `pwsh`** session.

VS Code shortcut: tasks labelled **`ION DEX: verify-100.ps1`** (see `.vscode/tasks.json`).

## GitHub Actions

Workflow: `.github/workflows/ion-dex-verify.yml`

Runs on every **push** and **pull_request**, plus manual **workflow_dispatch**: encoding check, `npm ci`, Playwright Chromium, `npm run verify`, `npm run audit:high`. The workflow targets `frontend/` at repo root (same layout after syncing `frontend/` next to `ion/`).

## Cursor Hooks (optional)

Automatic **stop** hooks are wired in-repo (see `.cursor/hooks.json`). On each Agent **stop** Cursor runs:

`.cursor/hooks/ion-verify-on-stop.cmd`:

1. `node scripts/compile-func.mjs` — all `contracts/ion` `.fc` files validated (deployable roots + probe graph for fragments). Fails fast if FunC is broken.
2. `scripts/agent-verify.cmd` — full baseline: encoding, backend verify + audit + stress, frontend verify + audit.

**Timeouts:** `hooks.json` uses `timeout: 900` (seconds). Increase if verify is slow on your machine.

Full Playwright **on every stop** remains heavy. Prefer that agents still call `scripts\agent-verify.cmd` after substantive edits so failures surface before hitting the hook.

If you bootstrap from scratch instead of cloning this repo:

1. Merge `docs/cursor-hooks-verify-stop.sample.json` with your `.cursor/hooks.json` entries.
2. Keep `.cursor/hooks/ion-verify-on-stop.cmd` (or replicate the compile + verify sequence above).

`failClosed` is `false`, so hook failure does not block the IDE entirely; inspect the Hooks output channel and fix red steps.

### After every save (Agent / Tab + editor Ctrl+S)

The repo is configured so **each save** runs a **FunC compile gate** (plus a **fast encoding check** on the saved file when the extension matches source-like types):

1. **Cursor Hooks** (`.cursor/hooks.json`):
   - `afterFileEdit` — after Agent applies a `Write`-style edit.
   - `afterTabFileEdit` — after **Tab** inline completion writes a file.
   - Both invoke: `node scripts/ion-on-save-pipeline.mjs --cursor-hook` (reads `file_path` from stdin JSON; `timeout` **540**s, `failClosed: false`).

2. **VS Code / Cursor manual save (Ctrl+S)** — workspace setting **`.vscode/settings.json`** uses the **Run On Save** extension (`emeraldwalk.RunOnSave`):
   - Command: `node "${workspaceFolder}/scripts/ion-on-save-pipeline.mjs" "${file}"`
   - Skips `node_modules`, `.git`, `dist`, `build`, `out`, `coverage` via `notMatch`.

Install the extension when prompted (**Extensions: Show Recommended Extensions**) or from the marketplace id **`emeraldwalk.RunOnSave`**. Without it, **only** Cursor hook paths (Agent/Tab) run the pipeline; **manual save** will not.

**Cost:** `compile-func.mjs` walks all `contracts/ion` targets (~tens of seconds). Expect noticeable delay on every save; disable Run On Save or remove the hook entries if it is too slow. Compile output uses `stdio: inherit` (visible in the Hooks / Run on Save output panel).
