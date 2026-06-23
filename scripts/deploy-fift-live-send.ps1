# Live broadcast segment — plan (StateInit BoC) or send (+ wallet-query BoC).
# Usage:
#   $env:ION_DEPLOY_BROADCAST='1'
#   $env:ION_DEPLOY_SEND_MODE='plan'   # or 'send'
#   ... required ION_DEPLOY_* addresses ...
#   powershell -File scripts/deploy-fift-live-send.ps1 -Network testnet

param(
    [ValidateSet("testnet", "mainnet")]
    [string]$Network = "testnet",
    [ValidateSet("plan", "send")]
    [string]$SendMode = "plan",
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
$env:ION_DEPLOY_BROADCAST = "1"
$env:ION_DEPLOY_SEND_MODE = $SendMode

if (-not $SkipConfirm) {
    $expected = "YES BROADCAST to $Network"
    Write-Host "Type exactly: $expected" -ForegroundColor Yellow
    $answer = Read-Host "Confirm"
    if ($answer -ne $expected) {
        throw "Confirmation mismatch — aborted."
    }
    $env:ION_DEPLOY_CONFIRM = $expected
}

Set-Location $root
node scripts/deploy-fift-live-send.mjs
if ($LASTEXITCODE -ne 0) {
    throw "deploy-fift-live-send.mjs failed"
}
Write-Host "OK - broadcast segment complete" -ForegroundColor Green
