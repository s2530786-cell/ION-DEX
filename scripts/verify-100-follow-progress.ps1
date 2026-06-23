# Foreground progress monitor for verify-100 (attach to an already-running gate).
param(
  [int]$PollSeconds = 10,
  [string]$SummaryPath = ""
)

$ErrorActionPreference = "Continue"

function Get-LatestSummary {
  param([string]$Explicit)
  if ($Explicit -and (Test-Path $Explicit)) {
    return Get-Item $Explicit
  }
  $all = Get-ChildItem (Join-Path $env:TEMP "ion-verify-100-summary-*.txt") -ErrorAction SilentlyContinue
  if (-not $all) {
    return $null
  }
  foreach ($item in ($all | Sort-Object LastWriteTime -Descending)) {
    $lines = Get-Content $item.FullName -ErrorAction SilentlyContinue
    if ($lines -match "^RESULT=GREEN$" -and ($lines -match "^PASSED=100$")) {
      return $item
    }
  }
  return $all | Sort-Object LastWriteTime -Descending | Select-Object -First 1
}

function Read-Progress([string]$Path) {
  $lines = Get-Content $Path -ErrorAction SilentlyContinue
  $passOk = @($lines | Where-Object { $_ -match "^PASS \d+ OK$" }).Count
  $lastPass = ($lines | Where-Object { $_ -match "^PASS \d+ OK$" } | Select-Object -Last 1)
  $result = $lines | Where-Object { $_ -match "^RESULT=(GREEN|FAILED)$" } | Select-Object -Last 1
  $logLine = $lines | Where-Object { $_ -match "^LOG=" } | Select-Object -First 1
  return @{
    PassOk     = $passOk
    LastPass   = $lastPass
    Result     = $result
    LogLine    = $logLine
    Tail       = $lines | Select-Object -Last 6
  }
}

Write-Host ""
Write-Host "========================================"
Write-Host " ION verify-100 LIVE PROGRESS (foreground)"
Write-Host " Poll every ${PollSeconds}s — Ctrl+C to stop watching only"
Write-Host "========================================"
Write-Host ""

$summary = Get-LatestSummary -Explicit $SummaryPath
if (-not $summary) {
  Write-Host "No summary file yet. Start the gate with:"
  Write-Host "  scripts\verify-100-until-green-foreground.cmd"
  exit 1
}

Write-Host ("Summary: " + $summary.FullName)
Write-Host ("Updated: " + $summary.LastWriteTime)
Write-Host ""

while ($true) {
  $summary = Get-LatestSummary -Explicit $SummaryPath
  if (-not $summary) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] waiting for summary file..."
    Start-Sleep -Seconds $PollSeconds
    continue
  }

  $p = Read-Progress $summary.FullName
  $pct = [math]::Min(100, [int]$p.PassOk)
  $barFilled = [math]::Floor($pct / 5)
  $bar = ("#" * $barFilled).PadRight(20, ".")
  Write-Host ("[$(Get-Date -Format 'HH:mm:ss')] [$bar] $($p.PassOk)/100  $($p.LastPass)  $($p.Result)")

  foreach ($line in $p.Tail) {
    if ($line -match "^PASS \d+") {
      Write-Host ("  | " + $line)
    }
  }

  if ($p.LogLine) {
    Write-Host ("  log: " + ($p.LogLine -replace "^LOG=", ""))
  }

  if ($p.Result -match "RESULT=GREEN") {
    Write-Host ""
    Write-Host "RESULT=GREEN — gate satisfied."
    Write-Host ("Evidence: " + $summary.Name)
    exit 0
  }

  if ($p.Result -match "RESULT=FAILED") {
    Write-Host ""
    Write-Host "RESULT=FAILED on this summary — until-green should restart from 0."
    Write-Host "Keep this window open to watch the next summary file."
  }

  Start-Sleep -Seconds $PollSeconds
}
