# Hard restart: free ports, clear Vite cache, start backend if needed, frontend on :3010 (new origin = no stale cache).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$FrontendPort = 3010
$DevUrl = "http://127.0.0.1:$FrontendPort/"

Set-Location $Root
$head = (git rev-parse --short HEAD).Trim()
Write-Host "=== ION DEX hard restart ==="
Write-Host "branch=$(git branch --show-current) HEAD=$head"
Write-Host "URL: $DevUrl"
Write-Host ""

& "$Root\scripts\free-ion-dev-ports.ps1"

if (Test-Path "$Root\frontend\node_modules\.vite") {
  Remove-Item -Recurse -Force "$Root\frontend\node_modules\.vite"
  Write-Host "Cleared frontend/node_modules/.vite cache"
}

$listen = Get-NetTCPConnection -LocalPort $FrontendPort -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
if ($listen) {
  $ownPid = $listen.OwningProcess
  Write-Host "ERROR: port $FrontendPort still in use (PID $ownPid)." -ForegroundColor Red
  Write-Host "Close that terminal or: taskkill /F /PID $ownPid /T"
  exit 1
}

try {
  $null = Invoke-WebRequest -Uri "http://127.0.0.1:8787/api/health" -UseBasicParsing -TimeoutSec 2
} catch {
  Write-Host "Starting backend :8787 ..."
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$Root\backend'; npm run start -- --port 8787"
  Start-Sleep -Seconds 3
}

$env:VITE_ION_BUILD_STAMP = "$head @ :$FrontendPort $(Get-Date -Format 'HH:mm:ss')"
$env:VITE_ION_DEV_PORT = "$FrontendPort"
$env:VITE_ION_API_BASE_URL = "http://127.0.0.1:8787"

Set-Location "$Root\frontend"
npm install --no-audit --no-fund | Out-Host

Write-Host ""
Write-Host "Starting Vite on $DevUrl (look for magenta DEV ribbon at top)" -ForegroundColor Cyan
Start-Process $DevUrl
npm run dev:local
