# ION DEX — FunC P0: each contract must compile 100 times with zero errors.
# Usage: powershell -NoProfile -ExecutionPolicy Bypass -File scripts/func-compile-100.ps1
# Env overrides: ION_FUNC_EXE, ION_STDLIB_FC

param(
    [int]$PassesPerContract = 100,
    [string]$FuncExe = $env:ION_FUNC_EXE,
    [string]$StdlibFc = $env:ION_STDLIB_FC
)

$ErrorActionPreference = "Stop"

if (-not $FuncExe) {
    $FuncExe = "D:\openclaw-data\workspace\func.exe"
}
if (-not $StdlibFc) {
    $StdlibFc = "D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc"
}

$ionRoot = Join-Path $PSScriptRoot "..\contracts\ion" | Resolve-Path
$buildDir = Join-Path $ionRoot "build"
if (-not (Test-Path $buildDir)) {
    New-Item -ItemType Directory -Path $buildDir | Out-Null
}

$contracts = @(
    "pool.fc",
    "router.fc",
    "FeeDistributor.fc",
    "lp_account.fc",
    "lp_wallet.fc",
    "vault.fc",
    "staking-pool.fc",
    "sandwich.fc",
    "BridgeInbox.fc",
    "deployer.fc",
    "dns-auction.fc",
    "dns-registrar.fc",
    "dns-resolver.fc"
)

if (-not (Test-Path $FuncExe)) {
    Write-Error "func not found: $FuncExe (set ION_FUNC_EXE)"
}
if (-not (Test-Path $StdlibFc)) {
    Write-Error "stdlib.fc not found: $StdlibFc (set ION_STDLIB_FC)"
}

# stdlib must be first; gas + common before contract (user file order fails without stdlib first).
Set-Location $ionRoot

$summary = @()
$failedAny = $false

foreach ($contract in $contracts) {
    if (-not (Test-Path $contract)) {
        Write-Host "[FAIL] missing $contract" -ForegroundColor Red
        $failedAny = $true
        continue
    }

    Write-Host ""
    Write-Host "=== $contract ($PassesPerContract passes) ===" -ForegroundColor Cyan
    $failAt = 0

    for ($i = 1; $i -le $PassesPerContract; $i++) {
        $nullOut = Join-Path $buildDir ("_compile100_" + ($contract -replace '\.fc$','') + ".fif")
        $output = & $FuncExe -o $nullOut -SPA $StdlibFc common/gas.fc common/common.fc $contract 2>&1
        if ($LASTEXITCODE -ne 0) {
            $failAt = $i
            Write-Host "  FAIL at pass $i / $PassesPerContract" -ForegroundColor Red
            if ($output) {
                $output | ForEach-Object { Write-Host $_ }
            }
            $failedAny = $true
            $summary += [pscustomobject]@{ Contract = $contract; Passes = "$($i - 1)/$PassesPerContract"; Result = "FAIL" }
            break
        }
        if ($i % 25 -eq 0) {
            Write-Host "  $i / $PassesPerContract OK" -ForegroundColor DarkGray
        }
    }

    if ($failAt -eq 0) {
        Write-Host "  PASS $PassesPerContract/$PassesPerContract" -ForegroundColor Green
        $summary += [pscustomobject]@{ Contract = $contract; Passes = "$PassesPerContract/$PassesPerContract"; Result = "PASS" }
    }
}

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
$summary | Format-Table -AutoSize

if ($failedAny) {
    Write-Host "RESULT=RED" -ForegroundColor Red
    exit 1
}

Write-Host "RESULT=GREEN — all $($contracts.Count) contracts x $PassesPerContract passes" -ForegroundColor Green
exit 0
