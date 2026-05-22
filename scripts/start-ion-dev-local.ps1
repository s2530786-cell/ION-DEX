# Start ION DEX backend + frontend (latest dev) on Windows PowerShell.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

Set-Location $Root
Write-Host "=== ION DEX local dev (branch: $(git branch --show-current)) ==="
Write-Host "HEAD: $(git rev-parse --short HEAD)"

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

Write-Host "Starting frontend :3001 ..."
Set-Location "$Root\frontend"
npm run dev:local
