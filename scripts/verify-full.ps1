# Full verification: encoding + backend build/API tests/stress + frontend build/e2e + npm audit (high).
# Keep this file as UTF-8 without BOM. If PowerShell parsing fails on Windows,
# use scripts\verify-full.cmd or scripts\verify-full-save-log.cmd.

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "=== 0) Development preflight ==="
node (Join-Path $root "scripts\dev-preflight.mjs")
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== 1) Encoding check ==="
$encodingScript = Join-Path $root "scripts\check-encoding.ps1"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File $encodingScript
if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "=== 2) Backend verify (build + API tests) ==="
Push-Location (Join-Path $root "backend")
try {
  npm run verify
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  npm run audit:high
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
  npm run stress
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "=== 3) Frontend verify (build + Playwright) ==="
Push-Location (Join-Path $root "frontend")
try {
  npm run verify
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "=== 4) Frontend npm audit (high) ==="
Push-Location (Join-Path $root "frontend")
try {
  npm run audit:high
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }
}
finally {
  Pop-Location
}

Write-Host ""
Write-Host "OK - verify-full completed."
