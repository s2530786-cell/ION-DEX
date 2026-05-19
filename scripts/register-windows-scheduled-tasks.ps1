# Register local Windows Task Scheduler jobs for ION DEX automation gates.
# Run once as Administrator (optional) from repo root:
#   powershell -NoProfile -ExecutionPolicy Bypass -File scripts\register-windows-scheduled-tasks.ps1
# Remove: pass -Unregister

param(
  [switch]$Unregister
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot

$tasks = @(
  @{
    Name = "ION-DEX-Auto-Quick-30m"
    Mode = "quick"
    Schedule = "MINUTE"
    Interval = 30
    Description = "ION DEX: preflight + FunC + agent-verify every 30 minutes"
  },
  @{
    Name = "ION-DEX-Auto-Standard-Daily"
    Mode = "standard"
    Schedule = "DAILY"
    At = "03:15"
    Description = "ION DEX: quick gate + dual-chain-audit daily"
  },
  @{
    Name = "ION-DEX-Auto-Iron-Daily"
    Mode = "iron"
    Schedule = "DAILY"
    At = "04:00"
    Description = "ION DEX: iron-law-security (stress + ION/BSC 1500) daily"
  }
)

function Get-TaskAction {
  param([string]$Mode)
  $cmd = Join-Path $root "scripts\automation-scheduled-gate.cmd"
  return New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/d /c set ION_AUTO_MODE=$Mode&& call `"$cmd`"" -WorkingDirectory $root
}

if ($Unregister) {
  foreach ($t in $tasks) {
    Unregister-ScheduledTask -TaskName $t.Name -Confirm:$false -ErrorAction SilentlyContinue
    Write-Host "Removed:" $t.Name
  }
  exit 0
}

foreach ($t in $tasks) {
  $action = Get-TaskAction -Mode $t.Mode
  if ($t.Schedule -eq "MINUTE") {
    $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(2) -RepetitionInterval (New-TimeSpan -Minutes $t.Interval) -RepetitionDuration (New-TimeSpan -Days 3650)
  }
  else {
    $trigger = New-ScheduledTaskTrigger -Daily -At $t.At
  }
  $settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 6)
  Register-ScheduledTask -TaskName $t.Name -Action $action -Trigger $trigger -Settings $settings -Description $t.Description -Force | Out-Null
  Write-Host "Registered:" $t.Name "(" $t.Mode ")"
}

Write-Host ""
Write-Host "Manual long gates (do not schedule by default — multi-hour):"
Write-Host "  set ION_AUTO_MODE=verify100 && scripts\automation-scheduled-gate.cmd"
Write-Host "  scripts\start-verify-100-background.cmd"
Write-Host ""
Write-Host "Latest summary pointer: %TEMP%\ion-auto-gate-<mode>-latest.txt"
