#Requires -RunAsAdministrator
<#
.SYNOPSIS
  干净重启 OpenClaw Gateway，清理 Hermes 会话锁，恢复 Telegram 机器人。

  用法（在「以管理员身份运行」的 PowerShell 中）:
    Set-ExecutionPolicy -Scope Process Bypass -Force
    & "D:\openclaw-tools\ion-dex-nuke\scripts\fix-openclaw-gateway-restart.ps1"

  修复后请在 Telegram 向机器人发送: /new
#>
$ErrorActionPreference = 'Stop'

$openclawJson = Join-Path $env:USERPROFILE '.openclaw\openclaw.json'
$hermesSessions = Join-Path $env:USERPROFILE '.openclaw\agents\hermes\sessions'
$serviceName = 'OpenClawGW'
$nssmExe = 'C:\nssm_x64\nssm.exe'
$stuckSessionId = '8ec216bb-df41-4090-ac61-60a7c70a3f31'
# 与 openclaw.json gateway.port 一致；18790 常为 canvas/cursor-local 副端口
$configPort = 18789
if (Test-Path $openclawJson) {
  $raw = Get-Content -Path $openclawJson -Raw -Encoding UTF8
  if ($raw -match '"port"\s*:\s*(\d+)') {
    $configPort = [int]$Matches[1]
  }
}
$gatewayPorts = @($configPort, 18790) | Select-Object -Unique
# node.exe 作为 Application 时必须带 openclaw.mjs，否则 node 会找 package\gateway 模块并报 MODULE_NOT_FOUND
$desiredNssmParams = 'openclaw.mjs gateway --allow-unconfigured'

function Write-Step([string]$msg) {
  Write-Host "[fix-openclaw] $msg" -ForegroundColor Cyan
}

function Get-NssmValue([string]$key) {
  if (-not (Test-Path $nssmExe)) { return $null }
  $out = & $nssmExe get $serviceName $key 2>&1 | Out-String
  return ($out -replace "`r`n", '').Trim()
}

function Get-OpenClawGatewayProcesses() {
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object {
      $_.CommandLine -and (
        $_.CommandLine -match 'openclaw\.mjs"\s+gateway' -or
        $_.CommandLine -match 'openclaw\\package\\openclaw\.mjs"\s+gateway' -or
        $_.CommandLine -match 'openclaw\.mjs\s+gateway'
      )
    }
}

function Stop-ListenersOnPorts([int[]]$ports) {
  foreach ($port in $ports) {
    $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($c in $conns) {
      $listenerPid = $c.OwningProcess
      if ($listenerPid -le 0) { continue }
      $proc = Get-Process -Id $listenerPid -ErrorAction SilentlyContinue
      if (-not $proc) { continue }
      Write-Step "Stopping listener pid=$listenerPid on port $port ($($proc.ProcessName))"
      Stop-Process -Id $listenerPid -Force -ErrorAction SilentlyContinue
    }
  }
}

function Stop-OpenClawToolExtraGateways() {
  $tools = @(Get-Process -Name 'OpenClawTool' -ErrorAction SilentlyContinue)
  if ($tools.Count -eq 0) { return }
  Write-Step 'OpenClawTool.exe is running — stopping its extra gateway node children (prevents Telegram 409 vs OpenClawGW).'
  foreach ($tool in $tools) {
    $children = Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
      Where-Object { $_.ParentProcessId -eq $tool.Id -and $_.CommandLine -match 'gateway' }
    foreach ($ch in $children) {
      Write-Step "  Stopping OpenClawTool child gateway pid=$($ch.ProcessId)"
      Stop-Process -Id $ch.ProcessId -Force -ErrorAction SilentlyContinue
    }
  }
  Write-Host '  Tip: quit OpenClawTool tray app if you only want OpenClawGW service.' -ForegroundColor Yellow
}

Write-Step "Config gateway port (openclaw.json): $configPort"

if (Test-Path $nssmExe) {
  $currentParams = Get-NssmValue 'AppParameters'
  Write-Step "NSSM AppParameters now: $currentParams"
  if ($currentParams -and $currentParams -ne $desiredNssmParams) {
    Write-Step "Fixing NSSM -> $desiredNssmParams (must include openclaw.mjs; old 'gateway --port 18790' broke 18789 probe)"
    & $nssmExe set $serviceName AppParameters $desiredNssmParams | Out-Null
    $currentParams = Get-NssmValue 'AppParameters'
    Write-Step "NSSM AppParameters after fix: $currentParams"
  }
} else {
  Write-Warning "NSSM not found at $nssmExe — skip service parameter fix."
}

Write-Step 'OpenClaw gateway node processes (before cleanup):'
$ocNodes = @(Get-OpenClawGatewayProcesses)
if ($ocNodes.Count -eq 0) {
  Write-Step '  (none found via command line)'
} else {
  $ocNodes | ForEach-Object { Write-Step "  pid=$($_.ProcessId) $($_.CommandLine.Substring(0, [Math]::Min(120, $_.CommandLine.Length)))..." }
}

Write-Step 'Stopping Windows service (if present)...'
if (Get-Service $serviceName -ErrorAction SilentlyContinue) {
  $svcStatus = (Get-Service $serviceName).Status
  if ($svcStatus -eq 'Paused' -and (Test-Path $nssmExe)) {
    & $nssmExe stop $serviceName confirm 2>&1 | Out-Null
    Stop-Service $serviceName -Force -ErrorAction SilentlyContinue
  } elseif ($svcStatus -eq 'Running') {
    Stop-Service $serviceName -Force -ErrorAction SilentlyContinue
  }
  $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Service $serviceName).Status -ne 'Stopped' -and (Get-Date) -lt $deadline) {
    if ((Get-Service $serviceName).Status -eq 'Paused' -and (Test-Path $nssmExe)) {
      & $nssmExe stop $serviceName confirm 2>&1 | Out-Null
    }
    Start-Sleep -Seconds 2
  }
}

Start-Sleep -Seconds 2
Stop-OpenClawToolExtraGateways
Stop-ListenersOnPorts -ports $gatewayPorts

foreach ($p in Get-OpenClawGatewayProcesses) {
  Write-Step "Stopping openclaw gateway node pid=$($p.ProcessId)"
  Stop-Process -Id $p.ProcessId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Seconds 3

$stillListening = Get-NetTCPConnection -LocalPort $gatewayPorts -State Listen -ErrorAction SilentlyContinue
if ($stillListening) {
  Write-Warning 'Ports still in use; force-kill owning processes.'
  $stillListening | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 2
}

Write-Step 'Removing Hermes session lock files...'
if (Test-Path $hermesSessions) {
  Get-ChildItem -Path $hermesSessions -Filter '*.lock' -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue
  $stuckJsonl = Join-Path $hermesSessions "$stuckSessionId.jsonl"
  if (Test-Path $stuckJsonl) {
    $archiveDir = Join-Path $hermesSessions '_archived-stuck'
    New-Item -ItemType Directory -Path $archiveDir -Force | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $dest = Join-Path $archiveDir "$stuckSessionId-$stamp.jsonl"
    Write-Step "Archiving stuck session file -> $dest"
    Move-Item -Path $stuckJsonl -Destination $dest -Force
  }
}

if (Get-Service $serviceName -ErrorAction SilentlyContinue) {
  Write-Step "Starting Windows service: $serviceName"
  Start-Service $serviceName
  Write-Step 'Waiting for gateway ready (~30s startup per logs)...'
  $readyDeadline = (Get-Date).AddSeconds(45)
  $mainUp = $false
  while ((Get-Date) -lt $readyDeadline) {
    $listen = Get-NetTCPConnection -LocalPort $configPort -State Listen -ErrorAction SilentlyContinue
    if ($listen) {
      $mainUp = $true
      break
    }
    Start-Sleep -Seconds 3
  }
  if ($mainUp) {
    Write-Step "Port $configPort is listening."
  } else {
    Write-Warning "Port $configPort still not listening after 45s — check nssm-out.log"
  }
} else {
  Write-Warning "Service $serviceName not found."
}

Write-Step 'OpenClaw gateway processes (after restart):'
@(Get-OpenClawGatewayProcesses) | ForEach-Object {
  $line = $_.CommandLine
  if ($line.Length -gt 100) { $line = $line.Substring(0, 100) + '...' }
  Write-Step "  pid=$($_.ProcessId) $line"
}

Write-Step 'Listening ports:'
Get-NetTCPConnection -LocalPort $gatewayPorts -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess, State | Format-Table -AutoSize

$openclawCmd = Get-Command openclaw -ErrorAction SilentlyContinue
if ($openclawCmd) {
  Write-Step 'Gateway probe (45s timeout):'
  openclaw gateway probe --timeout 45000 2>&1
}

Write-Host ''
Write-Host 'Done. In Telegram send: /new  then retry your message.' -ForegroundColor Green
Write-Host "Main gateway must listen on $configPort (openclaw.json). Do not run a second gateway." -ForegroundColor Yellow
Write-Host 'If OpenClawTool tray is open, close it or only use OpenClawGW — not both.' -ForegroundColor Yellow
Write-Host 'Log: %LOCALAPPDATA%\Temp\openclaw\openclaw-2026-05-27.log  |  C:\Users\admin\.openclaw\nssm-out.log' -ForegroundColor Gray
