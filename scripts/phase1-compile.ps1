# Phase 1: Compilation Loop - 100 consecutive clean compilations
$scriptDir = "D:/openclaw-tools/ion-dex-nuke/contracts/ion"
$stdlib = "D:/openclaw-data/workspace/ion-official/ion/crypto/smartcont/stdlib.fc"
$func = "D:/openclaw-data/workspace/func.exe"
$contracts = @("pool.fc", "router.fc", "FeeDistributor.fc", "lp_account.fc", "lp_wallet.fc", "vault.fc", "staking-pool.fc", "sandwich.fc", "BridgeInbox.fc", "deployer.fc", "dns-auction.fc", "dns-registrar.fc", "dns-resolver.fc")

$totalPasses = 0
$consecutivePasses = 0
$target = 100
[long]$round = 0

New-Item -ItemType Directory -Force -Path "$scriptDir/build" | Out-Null

while ($consecutivePasses -lt $target) {
    $round++
    $passCount = 0
    $failCount = 0
    $failures = @()

    foreach ($c in $contracts) {
        $out = "$scriptDir/build/build_$($c -replace '.fc$','.fif')"
        $output = & $func -o $out -SPA $stdlib "$scriptDir/common/gas.fc" "$scriptDir/common/common.fc" "$scriptDir/$c" 2>&1
        if ($LASTEXITCODE -eq 0) {
            $passCount++
        } else {
            $failCount++
            $failures += $c
        }
    }

    if ($failCount -eq 0) {
        $consecutivePasses++
        $totalPasses++
        Write-Host ("Round " + $round + ": ALL PASS (" + $consecutivePasses + " consecutive)")
    } else {
        $consecutivePasses = 0
        Write-Host ("Round " + $round + ": " + $passCount + " pass, " + $failCount + " fail - FAILURES: " + ($failures -join ', '))
        exit 1
    }
}

Write-Host ""
Write-Host "=== PHASE 1 COMPLETE ==="
Write-Host ("Achieved " + $consecutivePasses + " consecutive clean compilations!")
Write-Host ("Total rounds: " + $round)
exit 0
