# kill-zombies.ps1 — Safe zombie process cleanup
# Never kills OpenClaw's own node processes (paths containing "openclaw", "dtlopenclaw")
$ErrorActionPreference = "SilentlyContinue"

$zombies = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    $p = $_.Path
    # Skip OpenClaw-related processes
    if ($p -match "openclaw|dtlopenclaw|clawdbot") { return $false }
    # Only kill high-memory zombies (>200MB WorkingSet)
    if ($_.WorkingSet64 -lt 200MB) { return $false }
    return $true
}

$conhost = Get-Process -Name "conhost" -ErrorAction SilentlyContinue

$killed = 0
foreach ($z in $zombies) {
    $memMB = [math]::Round($z.WorkingSet64 / 1MB, 0)
    Write-Host "Kill zombie node PID=$($z.Id) Mem=${memMB}MB Path=$($z.Path)"
    Stop-Process -Id $z.Id -Force
    $killed++
}

$ck = 0
foreach ($c in $conhost) {
    Stop-Process -Id $c.Id -Force
    $ck++
}

Write-Host "Killed $killed node zombies, $ck conhost"
exit 0
