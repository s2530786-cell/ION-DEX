# Register Windows daily task for ION GitHub discovery (08:00 local).
# UTF-8 without BOM. Run from repo root; may require elevated shell once.
param(
  [string]$TaskName = "ION-GitHub-Daily-Discovery",
  [string]$Time = "08:00",
  [switch]$Unregister
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$Runner = Join-Path $RepoRoot "scripts\github-daily.cmd"

if (-not (Test-Path $Runner)) {
  throw "Missing runner: $Runner"
}

if ($Unregister) {
  schtasks /Delete /TN $TaskName /F 2>$null
  Write-Host "Removed scheduled task: $TaskName"
  exit 0
}

$tr = "cmd.exe /c `"$Runner`""
schtasks /Create `
  /TN $TaskName `
  /TR $tr `
  /SC DAILY `
  /ST $Time `
  /RL LIMITED `
  /F | Out-String | Write-Host

Write-Host ""
Write-Host "Task registered: $TaskName @ $Time"
Write-Host "Runner: $Runner"
Write-Host ""
Write-Host "Pipeline: discovery + DEX enrich + Top-5 skill stubs (see scripts/github-daily-pipeline.mjs)"
Write-Host "Token: copy scripts/github-daily-token.local.example -> scripts/.github-token.local"
Write-Host "Optional daily clone: set machine env ION_GITHUB_DAILY_CLONE=1 (off by default)"
Write-Host "Test:  schtasks /Run /TN $TaskName"
Write-Host "Log:   ion-private-core/.memory-bank/github-daily/runs/pipeline-YYYY-MM-DD.log"
Write-Host "Remove: .\scripts\register-github-daily-task.ps1 -Unregister"
