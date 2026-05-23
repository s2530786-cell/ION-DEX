# Windows fift deploy helper — defaults to dry-run (no on-chain transactions).
# Usage:
#   powershell -File scripts/deploy-fift.ps1
#   powershell -File scripts/deploy-fift.ps1 -Network testnet -DryRun

param(
    [ValidateSet("testnet", "mainnet")]
    [string]$Network = "testnet",
    [switch]$DryRun = $true
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$ionRoot = Join-Path $root "contracts\ion"

$fift = $env:ION_FIFT_EXE
if (-not $fift) {
    $fift = "fift"
}

$stdlib = $env:ION_STDLIB_FC
if (-not $stdlib) {
    $stdlib = "D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc"
}

$fiftLib = $env:FIFTPATH
if (-not $fiftLib) {
    $candidate = "D:/openclaw-data/workspace/ion-official/ion/crypto/fift/lib"
    if (Test-Path $candidate) {
        $fiftLib = $candidate
    }
}

if ($DryRun) {
    $env:ION_DEPLOY_DRY_RUN = "1"
} else {
    $env:ION_DEPLOY_DRY_RUN = "0"
    Write-Warning "Live deploy mode: ensure ION_DEPLOY_* secrets and wallet are configured."
}

$env:ION_DEPLOY_NETWORK = $Network
if ($fiftLib) {
    $env:FIFTPATH = $fiftLib
}

Write-Host "=== ION DEX fift deploy (network=$Network dryRun=$DryRun) ===" -ForegroundColor Cyan
Set-Location $ionRoot

$checklist = Join-Path $ionRoot "deploy\deploy-checklist.fif"
$target = if (Test-Path $checklist) { "deploy/deploy-checklist.fif" } else { "deploy/deploy.fif" }
& $fift -s $target
if ($LASTEXITCODE -ne 0) {
    throw "fift deploy failed with exit $LASTEXITCODE"
}

Write-Host "OK - deploy.fif completed" -ForegroundColor Green
