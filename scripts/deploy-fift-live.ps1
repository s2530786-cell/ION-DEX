# Live deploy preflight (skeleton) — requires explicit confirmation, no on-chain broadcast.
# Usage:
#   $env:ION_DEPLOY_OWNER_ADDRESS='EQ...'
#   ... other ION_DEPLOY_* vars ...
#   powershell -File scripts/deploy-fift-live.ps1 -Network testnet

param(
    [ValidateSet("testnet", "mainnet")]
    [string]$Network = "testnet",
    [switch]$SkipConfirm
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$required = @(
    "ION_DEPLOY_OWNER_ADDRESS",
    "ION_DEPLOY_LP_RECIPIENT",
    "ION_DEPLOY_TREASURY_RECIPIENT",
    "ION_DEPLOY_INSURANCE_RECIPIENT",
    "ION_DEPLOY_TOKEN0_ADDRESS",
    "ION_DEPLOY_TOKEN1_ADDRESS"
)

foreach ($name in $required) {
    if (-not (Get-Item -Path "Env:$name" -ErrorAction SilentlyContinue)?.Value) {
        throw "Missing env $name"
    }
}

$env:ION_DEPLOY_NETWORK = $Network
$env:ION_DEPLOY_ALLOW_LIVE = "1"
$env:ION_DEPLOY_DRY_RUN = "0"

if (-not $SkipConfirm) {
    $expected = "YES I deploy to $Network"
    Write-Host "Type exactly: $expected" -ForegroundColor Yellow
    $answer = Read-Host "Confirm"
    if ($answer -ne $expected) {
        throw "Confirmation mismatch — aborted."
    }
    $env:ION_DEPLOY_CONFIRM = $expected
}

Write-Host "=== Running live deploy preflight (skeleton) ===" -ForegroundColor Cyan
Set-Location $root
node scripts/deploy-fift-live.mjs
if ($LASTEXITCODE -ne 0) {
    throw "deploy-fift-live.mjs failed"
}
Write-Host "OK - live preflight complete" -ForegroundColor Green
