# Start ION DEX backend + frontend on :3010 (use restart script if UI looks cached/stale).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FrontendPort = 3010
$DevUrl = "http://127.0.0.1:$FrontendPort/"

Set-Location $Root
$head = (git rev-parse --short HEAD).Trim()
Write-Host "=== ION DEX local dev (branch: $(git branch --show-current)) ==="
Write-Host "HEAD: $head"
Write-Host "Open: $DevUrl (NOT :3001 — old tabs may be cached)"
Write-Host ""

Set-Location "$Root\frontend"
npm install --no-audit --no-fund

Set-Location "$Root\backend"
npm install --no-audit --no-fund

$health = $null
try {
  $health = Invoke-WebRequest -Uri "http://127.0.0.1:8787/api/health" -UseBasicParsing -TimeoutSec 2
} catch {
  $health = $null
}

if (-not $health) {
  Write-Host "Starting backend :8787 in new window..."
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; npm run start -- --port 8787"
  Start-Sleep -Seconds 3
}

& "$Root\scripts\free-ion-dev-ports.ps1"

$portListen = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($portListen) {
  $blocker = $portListen.OwningProcess
  Write-Host "Port $FrontendPort in use (PID $blocker). Checking UI ..."
  Set-Location "$Root\frontend"
  $env:PLAYWRIGHT_BASE_URL = $DevUrl
  $prevEap = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  node scripts/check-dashboard-ui.mjs 2>&1 | ForEach-Object { Write-Host $_ }
  $uiOk = $LASTEXITCODE -eq 0
  $ErrorActionPreference = $prevEap
  if ($uiOk) {
    Write-Host ""
    Write-Host "OK: $DevUrl already serves the current dashboard UI." -ForegroundColor Green
    Write-Host "If the browser still looks old, run: .\scripts\restart-ion-dev-local.ps1"
    Start-Process $DevUrl
    exit 0
  }
  Write-Host ""
  Write-Host "ERROR: port $FrontendPort is held by stale UI (PID $blocker)." -ForegroundColor Red
  Write-Host "Run: .\scripts\restart-ion-dev-local.ps1"
  exit 1
}

$env:VITE_ION_BUILD_STAMP = "$head @ :$FrontendPort"
$env:VITE_ION_DEV_PORT = "$FrontendPort"
$env:VITE_ION_API_BASE_URL = "http://127.0.0.1:8787"

Write-Host ""
Write-Host "Starting frontend on $DevUrl ..."
Write-Host "Top of page must show magenta DEV ribbon. Then Ctrl+Shift+R if needed."
Write-Host ""
Set-Location "$Root\frontend"
Start-Process $DevUrl
npm run dev:local
