#Requires -RunAsAdministrator
<#
.SYNOPSIS
  一键恢复 OpenClaw Gateway：NSSM 已对齐 18789 后，强制停服、清端口、重启并等待 probe。

  在「以管理员身份运行」的 PowerShell 中执行（顺序已写好，不要拆开乱序跑）:
    Set-ExecutionPolicy -Scope Process Bypass -Force
    & "D:\openclaw-tools\ion-dex-nuke\scripts\fix-openclaw-gateway-now.ps1"
#>
$ErrorActionPreference = 'Stop'
$serviceName = 'OpenClawGW'
$nssmExe = 'C:\nssm_x64\nssm.exe'
# NSSM Application 是 node.exe 时，必须带上入口脚本，不能只有 "gateway"（会变成 node gateway → MODULE_NOT_FOUND）
$desiredParams = 'openclaw.mjs gateway --allow-unconfigured'
$configPort = 18789
$openclawJson = Join-Path $env:USERPROFILE '.openclaw\openclaw.json'
if (Test-Path $openclawJson) {
  $raw = Get-Content -Path $openclawJson -Raw -Encoding UTF8
  if ($raw -match '"port"\s*:\s*(\d+)') { $configPort = [int]$Matches[1] }
}
$ports = @($configPort, 18790, 18791) | Select-Object -Unique

function Step([string]$msg) { Write-Host "[gateway-now] $msg" -ForegroundColor Cyan }

Step "Config port = $configPort"

if (Test-Path $nssmExe) {
  $p = (& $nssmExe get $serviceName AppParameters 2>&1 | Out-String).Trim()
  Step "NSSM AppParameters = $p"
  if ($p -ne $desiredParams) {
    Step "Fixing NSSM -> $desiredParams"
    & $nssmExe set $serviceName AppParameters $desiredParams | Out-Null
  }
}

Step '1/5 Stop OpenClawGW service (incl. PAUSED)'
if (Get-Service $serviceName -ErrorAction SilentlyContinue) {
  $svc = Get-Service $serviceName
  if ($svc.Status -eq 'Paused') {
    if (Test-Path $nssmExe) { & $nssmExe stop $serviceName confirm 2>&1 | Out-Null }
    Stop-Service $serviceName -Force -ErrorAction SilentlyContinue
  } elseif ($svc.Status -eq 'Running') {
    Stop-Service $serviceName -Force
  }
  $deadline = (Get-Date).AddSeconds(60)
  do {
    $svcStatus = (Get-Service $serviceName).Status
    if ($svcStatus -eq 'Paused' -and (Test-Path $nssmExe)) {
      & $nssmExe stop $serviceName confirm 2>&1 | Out-Null
    }
    if ($svcStatus -ne 'Stopped') { Start-Sleep -Seconds 2 }
  } while (($svcStatus -ne 'Stopped') -and ((Get-Date) -lt $deadline))
}

Step '2/5 Kill listeners on gateway ports (stale node from old --port 18790)'
Start-Sleep -Seconds 2
foreach ($port in $ports) {
  Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
    ForEach-Object {
      Step "  Stop pid $($_.OwningProcess) on port $port"
      Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

Step '3/5 Stop OpenClawTool extra gateway children (avoid Telegram 409)'
Get-Process -Name 'OpenClawTool' -ErrorAction SilentlyContinue | ForEach-Object {
  $toolId = $_.Id
  Get-CimInstance Win32_Process -Filter "Name='node.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.ParentProcessId -eq $toolId -and $_.CommandLine -match 'gateway' } |
    ForEach-Object {
      Step "  Stop OpenClawTool child pid=$($_.ProcessId)"
      Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
    }
}

Step '4/5 Start OpenClawGW and wait for port ' + $configPort + ' (up to 50s, ready ~23s)'
Start-Service $serviceName
$listening = $false
for ($i = 0; $i -lt 25; $i++) {
  $conn = Get-NetTCPConnection -LocalPort $configPort -State Listen -ErrorAction SilentlyContinue
  if ($conn) {
    $listening = $true
    Step "  Port $configPort listening (pid $($conn.OwningProcess)) after $($i * 2)s"
    break
  }
  Start-Sleep -Seconds 2
}

Step '5/5 Ports + probe'
Get-NetTCPConnection -LocalPort $ports -State Listen -ErrorAction SilentlyContinue |
  Select-Object LocalPort, OwningProcess | Format-Table -AutoSize

if (-not $listening) {
  Write-Host "[gateway-now] FAIL: port $configPort still not listening. Check:" -ForegroundColor Red
  Write-Host "  $env:LOCALAPPDATA\Temp\openclaw\openclaw-$(Get-Date -Format yyyy-MM-dd).log"
  Write-Host "  C:\Users\admin\.openclaw\nssm-err.log"
  exit 1
}

& openclaw gateway probe --timeout 45000
Write-Host ''
Write-Host 'If Reachable: yes -> Telegram send /new. Do NOT run a second openclaw gateway.' -ForegroundColor Green
