# Cursor Progress Monitor
# Usage: powershell -File monitor-cursor.ps1
# Reports: git log changes, file changes, Cursor health

param([switch]$Once)

$project = "D:\openclaw-tools\ion-dex-nuke"
$healthScript = "D:\openclaw-data\workspace\scripts\cursor-health.ps1"
$lastCommit = (git -C $project log --oneline -1)
$logFile = "D:\openclaw-data\workspace\memory\cursor-monitor.log"

function Check-Cursor {
    $health = & powershell -File $healthScript 2>&1
    $online = $health -match "OK"
    
    Set-Location $project
    $currentCommit = git log --oneline -1
    $newCommits = if ($currentCommit -ne $lastCommit) { git log --oneline "$lastCommit..HEAD" 2>$null } else { "" }
    
    $changedFiles = Get-ChildItem "$project\contracts" -Recurse -File -ErrorAction SilentlyContinue | 
        Where-Object { $_.LastWriteTime -gt (Get-Date).AddMinutes(-10) -and $_.Name -notlike "*cache*" -and $_.Name -notlike "*.json" -and $_.DirectoryName -notlike "*node_modules*" -and $_.DirectoryName -notlike "*lib*" } |
        Select-Object Name, LastWriteTime
    
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $msg = "$ts | Cursor: $(if($online){'ONLINE'}{'OFFLINE'}) | Procs: $($health -replace '.*Procs=(\d+).*','$1') | Mem: $($health -replace '.*MaxMem=([\d.]+)MB.*','$1')MB"
    Write-Output $msg
    Add-Content -Path $logFile -Value $msg
    
    if ($newCommits) {
        $commitMsg = "$ts | NEW COMMIT:`n$newCommits"
        Write-Output $commitMsg
        Add-Content -Path $logFile -Value $commitMsg
        $script:lastCommit = $currentCommit
    }
    
    if ($changedFiles) {
        $fileMsg = "$ts | Changed files (last 10min):"
        Write-Output $fileMsg
        Add-Content -Path $logFile -Value $fileMsg
        foreach ($f in $changedFiles) {
            $detail = "  $($f.Name) @ $($f.LastWriteTime)"
            Write-Output $detail
            Add-Content -Path $logFile -Value $detail
        }
    }
    
    return @{ Online = $online; Commits = $newCommits; Files = $changedFiles }
}

# Run once or loop
if ($Once) {
    Check-Cursor
} else {
    # Loop: check every 5 minutes
    while ($true) {
        Check-Cursor | Out-Null
        Start-Sleep 300
    }
}
