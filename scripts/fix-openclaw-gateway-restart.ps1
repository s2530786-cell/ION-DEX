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

$gatewayPorts = @(18789, 18790)
$hermesSessions = Join-Path $env:USERPROFILE '.openclaw\agents\hermes\sessions'
$serviceName = 'OpenClawGW'

function Write-Step([string]$msg) {
  Write-Host "[fix-openclaw] $msg" -ForegroundColor Cyan
}

Write-Step 'Stopping duplicate listeners (non-service node on 18790 if stray)...'
foreach ($port in $gatewayPorts) {
  $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
  foreach ($c in $conns) {
    $pid = $c.OwningProcess
    if ($pid -le 0) { continue }
    $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue
    if (-not $proc) { continue }
    # 18790 可能是 cursor-local 代理，由主 Gateway 拉起；只结束非 OpenClawGW 的重复 gateway
    if ($port -eq 18790 -and (Get-Service $serviceName -ErrorAction SilentlyContinue).Status -eq 'Running') {
      Write-Step "Port $port pid=$pid (likely cursor-local proxy; skip kill unless service stopped)"
      continue
    }
    Write-Step "Stopping pid=$pid on port $port"
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
  }
}

if (Get-Service $serviceName -ErrorAction SilentlyContinue) {
  Write-Step "Stopping Windows service: $serviceName"
  Stop-Service $serviceName -Force -ErrorAction SilentlyContinue
  $deadline = (Get-Date).AddSeconds(60)
  while ((Get-Service $serviceName).Status -ne 'Stopped' -and (Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 2
  }
  if ((Get-Service $serviceName).Status -ne 'Stopped') {
    Write-Warning "Service did not stop in time; killing listeners on $($gatewayPorts -join ',')"
    Get-NetTCPConnection -LocalPort $gatewayPorts -ErrorAction SilentlyContinue |
      ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
    Start-Sleep -Seconds 3
  }
}

Write-Step 'Removing Hermes session lock files...'
if (Test-Path $hermesSessions) {
  Get-ChildItem -Path $hermesSessions -Filter '*.lock' -ErrorAction SilentlyContinue |
    Remove-Item -Force -ErrorAction SilentlyContinue
  $remaining = @(Get-ChildItem -Path $hermesSessions -Filter '*.lock' -ErrorAction SilentlyContinue).Count
  Write-Step "Lock files remaining: $remaining"
}

if (Get-Service $serviceName -ErrorAction SilentlyContinue) {
  Write-Step "Starting Windows service: $serviceName"
  Start-Service $serviceName
  Start-Sleep -Seconds 10
  $status = (Get-Service $serviceName).Status
  Write-Step "Service status: $status"
} else {
  Write-Warning "Service $serviceName not found. Start gateway manually:"
  Write-Host '  cd F:\dtlopenclaw\tools\openclaw\package' -ForegroundColor Yellow
  Write-Host '  openclaw gateway' -ForegroundColor Yellow
}

Write-Step 'Listening ports:'
Get-NetTCPConnection -LocalPort $gatewayPorts -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess, State | Format-Table -AutoSize

$openclawCmd = Get-Command openclaw -ErrorAction SilentlyContinue
if ($openclawCmd) {
  Write-Step 'Gateway probe:'
  openclaw gateway probe --timeout 15000 2>&1
}

Write-Host ''
Write-Host 'Done. In Telegram send: /new  then retry your message.' -ForegroundColor Green
Write-Host 'If errors persist, check: %LOCALAPPDATA%\Temp\openclaw\openclaw-2026-05-27.log' -ForegroundColor Gray
