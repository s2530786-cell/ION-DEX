$env:PATH += ";D:\openclaw-tools\foundry\bin"
Set-Location D:\openclaw-tools\ion-dex-nuke\contracts

$failed = 0
for ($i = 1; $i -le 100; $i++) {
    $output = forge test --match-path "test/*.t.sol" --no-match-path "lib/**" 2>&1 | Out-String
    if ($output -notmatch "81 tests passed, 0 failed") {
        Write-Host "FAIL at round $i"
        Write-Host $output
        $failed++
        break
    }
    if ($i % 10 -eq 0) { Write-Host "Round $i/100 OK" }
}
if ($failed -eq 0) {
    Write-Host "100_ROUNDS_ALL_GREEN"
    exit 0
} else {
    exit 1
}
