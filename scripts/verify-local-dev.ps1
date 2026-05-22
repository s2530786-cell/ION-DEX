# Quick gate: correct git HEAD + backend health + new dashboard UI on :3001.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Set-Location $Root
$head = (git rev-parse --short HEAD).Trim()
$branch = (git branch --show-current).Trim()
Write-Host "branch=$branch HEAD=$head"

$okHead = $head -match '^(fbdb76e|b5ae901)'
if (-not $okHead) {
  Write-Host "FAIL: HEAD should be fbdb76e or at least b5ae901 (not 17896ec)." -ForegroundColor Red
  exit 1
}

try {
  $health = Invoke-WebRequest -Uri "http://127.0.0.1:8787/api/health" -UseBasicParsing -TimeoutSec 3
  Write-Host "backend :8787 -> $($health.StatusCode)"
} catch {
  Write-Host "WARN: backend :8787 not reachable (frontend-only check continues)"
}

$devPort = 3010
$devUrl = "http://127.0.0.1:$devPort/"
$listen = Get-NetTCPConnection -LocalPort $devPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if (-not $listen) {
  Write-Host "FAIL: nothing listening on :$devPort. Run .\scripts\restart-ion-dev-local.ps1" -ForegroundColor Red
  exit 1
}
Write-Host "frontend :$devPort -> PID $($listen.OwningProcess)"

Set-Location "$Root\frontend"
$env:PLAYWRIGHT_BASE_URL = $devUrl
node scripts/check-dashboard-ui.mjs
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
npx playwright test e2e/smoke.spec.ts -g "home page shows key sections" --reporter=line
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host ""
Write-Host "OK: open $devUrl and confirm magenta DEV ribbon at top; hard-refresh (Ctrl+Shift+R)." -ForegroundColor Green
Write-Host "Expect: Professional Trading Surface, Open Trade, dashboard-swap-stage, dashboard-orderbook-panel."
