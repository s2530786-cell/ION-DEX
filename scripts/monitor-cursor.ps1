# monitor-cursor.ps1 — Cursor session activity monitor
# Exit codes: 0=active, 1=stalled>1hr, 2=not running
param([switch]$Once)

$RepoRoot = "D:\openclaw-tools\ion-dex-nuke"
$StallMinutes = 60 # 1 hour stall threshold

# Check if Cursor is running
$cursorProcs = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if (-not $cursorProcs) {
    Write-Host "STALLED: Cursor not running"
    exit 2
}

# Check last git commit time
Push-Location $RepoRoot
try {
    $lastCommitStr = git log -1 --format="%at" 2>$null
    if ($lastCommitStr) {
        $lastCommitTime = [DateTimeOffset]::FromUnixTimeSeconds([long]$lastCommitStr).LocalDateTime
        $elapsed = [DateTime]::Now - $lastCommitTime
        $elapsedMin = [math]::Round($elapsed.TotalMinutes, 0)

        # Check for uncommitted changes (active work)
        $dirty = git status --porcelain 2>$null
        $dirtyCount = if ($dirty) { ($dirty | Measure-Object).Count } else { 0 }

        if ($elapsedMin -gt $StallMinutes -and $dirtyCount -eq 0) {
            Write-Host "STALLED: Last commit ${elapsedMin}min ago, no dirty files"
            exit 1
        }

        Write-Host "ACTIVE: Last commit ${elapsedMin}min ago, ${dirtyCount} dirty files"
        exit 0
    } else {
        Write-Host "STALLED: No git commits found"
        exit 1
    }
} finally {
    Pop-Location
}
