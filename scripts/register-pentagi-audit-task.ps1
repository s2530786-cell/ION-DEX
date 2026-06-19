# Register Windows scheduled task for ION Pentagi audit sandbox.
# UTF-8 without BOM. Run from repo root; may require elevated shell once.
param(
  [string]$TaskName = "ION-DEX-Pentagi-Audit",
  [string]$Time = "02:30",
  [switch]$Unregister
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Runner = Join-Path $RepoRoot "scripts\run-pentagi-audit.cmd"

if (-not (Test-Path $Runner)) {
  throw "Missing runner: $Runner"
}

if ($Unregister) {
  schtasks /Delete /TN $TaskName /F 2>$null
  Write-Host "Removed scheduled task: $TaskName"
  exit 0
}

$trigger = "cmd.exe /c `"$Runner`""
schtasks /Create `
  /TN $TaskName `
  /TR $trigger `
  /SC DAILY `
  /ST $Time `
  /RL LIMITED `
  /F | Out-String | Write-Host

Write-Host ""
Write-Host "Task registered: $TaskName @ $Time"
Write-Host "Runner: $Runner"
Write-Host "Profile: docker/security-sandbox/docker-compose.yml --profile pentagi"
Write-Host "Default URL: https://127.0.0.1:18443"
Write-Host "Test:  schtasks /Run /TN $TaskName"
Write-Host "Query: schtasks /Query /TN $TaskName /V /FO LIST"
Write-Host "Remove: .\scripts\register-pentagi-audit-task.ps1 -Unregister"
