# Six-pillar verification

Full checklist: `docs/verification-six-pillars.md`

Quick commands:

- Repo root encoding: `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\check-encoding.ps1`
- Backend: `cd backend && npm run verify && npm run audit:high && npm run stress`
- Frontend: `cd frontend && npm run verify && npm run audit:high`
- Full script (PowerShell): `powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\verify-full.ps1`
- Full script (CMD): `.\scripts\verify-full.cmd`
- **Agents / CI (no interactive `pause`)**: `.\scripts\agent-verify.cmd` — also see `docs/08-ci-agent-automation.md`
- Debugging in one window with `pause` at the end: `.\scripts\verify-full-debug.cmd`
- If output scrolls away: `.\scripts\verify-full-save-log.cmd` writes `%TEMP%\ion-verify-full.txt` and prints it (use `.\scripts\verify-full-save-log.cmd --no-pause` when nobody is at the keyboard).

First Playwright install:

```powershell
cd frontend
npx playwright install chromium
```

If Cursor Agent captures empty stdout, run the save-log script and ask the agent to read `%TEMP%\ion-verify-full.txt`.
