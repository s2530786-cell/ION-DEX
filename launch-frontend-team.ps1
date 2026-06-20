# ION DEX Frontend Team Auto-Launcher v2.2
# 一键启动：Cursor GUI (schtasks) + Dev Server (Start-Job) + Pipeline
# 用法: .\launch-frontend-team.ps1 [-SkipCursor] [-SkipDevServer] [-SkipPipeline]
# Cron: 每30分钟自动执行

param(
    [switch]$SkipCursor,
    [switch]$SkipDevServer,
    [switch]$SkipPipeline
)

$ErrorActionPreference = "Continue"
$script:ProjectRoot = "D:\openclaw-tools\ion-dex-nuke"
$script:LogFile = "$script:ProjectRoot\logs\launcher-$(Get-Date -Format 'yyyy-MM-dd-HHmm').log"
New-Item -ItemType Directory -Path "$script:ProjectRoot\logs" -Force | Out-Null
$script:CheckScript = "D:\openclaw-data\workspace\scripts\cursor-gui-check-interactive.ps1"
$script:StatusPath = "D:\openclaw-data\workspace\cursor-gui-status.json"
$script:CursorTaskName = "CursorGuiHealthCheck"

function Write-Log {
    param([string]$Msg, [string]$Level = "INFO")
    $ts = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $line = "[$ts] [$Level] $Msg"
    Write-Host $line
    Add-Content -Path $script:LogFile -Value $line
}

function Test-DevServer {
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

Write-Log "============================================"
Write-Log "ION DEX Frontend Team Auto-Launcher v2.2"
Write-Log "============================================"

# ── Step 1: Cursor GUI (via schtasks InteractiveToken) ──
if (-not $SkipCursor) {
    Write-Log "Step 1/3: Cursor GUI..."
    
    # 确保 check 脚本存在
    if (-not (Test-Path $script:CheckScript)) {
        Write-Log "Creating check script..."
        @'
$ErrorActionPreference = 'Continue'
$cursorExe = 'C:\Users\admin\AppData\Local\Programs\cursor\Cursor.exe'
$projectPath = 'D:\openclaw-tools\ion-dex-nuke'
$statusPath = 'D:\openclaw-data\workspace\cursor-gui-status.json'

function Write-Status($state, $message, $cursorPid = $null, $title = $null) {
  $obj = [ordered]@{
    timestamp = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')
    state = $state
    message = $message
    cursorPid = $cursorPid
    title = $title
    sessionId = (Get-Process -Id $PID).SessionId
  }
  $obj | ConvertTo-Json -Compress | Set-Content -Path $statusPath -Encoding UTF8
}

$win = Get-Process -Name Cursor -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
if ($win) {
    Write-Status 'OK' 'Visible Cursor GUI found' $win.Id $win.MainWindowTitle
    exit 0
}

Get-Process -Name Cursor -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -eq 0 } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Start-Process -FilePath $cursorExe -ArgumentList "`"$projectPath`"" -WindowStyle Normal | Out-Null

for ($i = 0; $i -lt 45; $i++) {
    Start-Sleep -Seconds 1
    $win = Get-Process -Name Cursor -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1
    if ($win) {
        Write-Status 'LAUNCHED' 'Cursor GUI launched' $win.Id $win.MainWindowTitle
        exit 0
    }
}
Write-Status 'FATAL' 'No Cursor GUI after 45s'
exit 2
'@ | Set-Content -Path $script:CheckScript -Encoding UTF8
    }
    
    # 确保 schtasks 存在
    $task = Get-ScheduledTask -TaskName $script:CursorTaskName -ErrorAction SilentlyContinue
    if (-not $task) {
        $action = New-ScheduledTaskAction -Execute "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$($script:CheckScript)`""
        $principal = New-ScheduledTaskPrincipal -UserId 'admin' -LogonType Interactive -RunLevel Highest
        $settings = New-ScheduledTaskSettingsSet -MultipleInstances Parallel
        Register-ScheduledTask -TaskName $script:CursorTaskName -Action $action -Principal $principal -Settings $settings -Force | Out-Null
    }
    
    # 触发检查
    Start-ScheduledTask -TaskName $script:CursorTaskName
    Start-Sleep -Seconds 10
    
    if (Test-Path $script:StatusPath) {
        $status = Get-Content $script:StatusPath -Raw | ConvertFrom-Json
        $lvl = if ($status.state -eq 'OK' -or $status.state -eq 'LAUNCHED') { "OK" } else { "WARN" }
        Write-Log "Cursor GUI: $($status.state) - $($status.message)" $lvl
        if ($status.cursorPid) { Write-Log "  PID=$($status.cursorPid) Title='$($status.title)' Session=$($status.sessionId)" }
    }
    else {
        Write-Log "Cursor GUI: no status file" "WARN"
    }
}
else {
    Write-Log "Step 1/3: Cursor GUI skipped" "SKIP"
}

# ── Step 2: Dev Server ──
if (-not $SkipDevServer) {
    Write-Log "Step 2/3: Dev Server..."
    if (Test-DevServer) {
        Write-Log "Dev server already running" "OK"
    }
    else {
        $portCheck = netstat -ano | Select-String ":3000"
        if ($portCheck) {
            $pidStr = ($portCheck -split '\s+')[-1]
            Write-Log "Port 3000 in use by PID $pidStr, killing..."
            Stop-Process -Id $pidStr -Force -ErrorAction SilentlyContinue
            Start-Sleep -Seconds 3
        }

        $oldJob = Get-Job -Name "ION-DEX-DevServer" -ErrorAction SilentlyContinue
        if ($oldJob) {
            Write-Log "Removing old job..."
            Remove-Job -Name "ION-DEX-DevServer" -Force -ErrorAction SilentlyContinue
        }

        Write-Log "Starting Next.js via Start-Job..."
        $null = Start-Job -Name "ION-DEX-DevServer" -ScriptBlock {
            Set-Location "D:\openclaw-tools\ion-dex-nuke"
            $env:HTTP_PROXY = "http://127.0.0.1:7890"
            $env:HTTPS_PROXY = "http://127.0.0.1:7890"
            npx next dev --port 3000 2>&1
        }

        $ready = $false
        for ($i = 0; $i -lt 45; $i++) {
            Start-Sleep -Seconds 2
            if (Test-DevServer) {
                Write-Log "Dev server ready (took $($i*2)s)" "OK"
                $ready = $true
                break
            }
            $job = Get-Job -Name "ION-DEX-DevServer" -ErrorAction SilentlyContinue
            if ($job -and $job.State -eq 'Failed') {
                $err = Receive-Job -Name "ION-DEX-DevServer" -ErrorAction SilentlyContinue
                Write-Log "Next.js failed: $err" "ERROR"
                break
            }
        }
        if (-not $ready) {
            Write-Log "Dev server not ready after 90s" "WARN"
        }
    }
}
else {
    Write-Log "Step 2/3: Dev Server skipped" "SKIP"
}

# ── Step 3: Pipeline ──
if (-not $SkipPipeline) {
    Write-Log "Step 3/3: Pipeline..."
    $pipelineScript = Join-Path $script:ProjectRoot "scripts\pipeline\pipeline-frontend.ps1"
    if (Test-Path $pipelineScript) {
        Write-Log "Executing: $pipelineScript -Mode full"
        $result = & $pipelineScript -Mode full 2>&1
        $exitCode = $LASTEXITCODE
        foreach ($line in $result) { Write-Log $line }
        if ($exitCode -eq 0) { Write-Log "Pipeline OK" "OK" }
        else { Write-Log "Pipeline exit code: $exitCode" "WARN" }
    }
    else {
        Write-Log "Pipeline script not found" "ERROR"
    }
}
else {
    Write-Log "Step 3/3: Pipeline skipped" "SKIP"
}

# ── Status ──
Write-Log "============================================"
$devUp = Test-DevServer
Write-Log "STATUS: DevServer=$(if($devUp){'UP'}else{'DOWN'})"
Write-Log "Log: $LogFile"
if ($devUp) { exit 0 } else { exit 1 }
