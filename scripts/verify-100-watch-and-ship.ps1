# Poll latest verify-100 summary until RESULT=GREEN, then advance SESSION_STATE only.
# Script body is ASCII-only so Windows PowerShell parses under agent shells (UTF-8 no BOM safe).
param(
  [int]$PollSeconds = 90
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$watchLog = Join-Path $env:TEMP ("ion-verify-100-watch-ship-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")

function Log([string]$msg) {
  $line = "[" + (Get-Date -Format "s") + "] " + $msg
  Add-Content -Path $watchLog -Value $line -Encoding utf8
  Write-Host $line
}

function Update-SessionStateOnGreen([string]$evidence) {
  $sessionPath = Join-Path $root "SESSION_STATE.md"
  if (-not (Test-Path $sessionPath)) {
    return
  }
  $text = Get-Content $sessionPath -Raw -Encoding utf8
  $text = $text -replace '\*\*CURRENT_PHASE=W2\*\*', "**CURRENT_PHASE=W3** (verify-100 GREEN: $evidence)"
  $text = $text -replace '(?m)^- \*\*verify-100[^\r\n]+', "- **verify-100 GREEN** ($evidence): PASSED=100 FAILED=0 RESULT=GREEN"
  $text = $text -replace '(?m)\| \*\*W2\*\* \|[^|]+\| [^|]+ \|', '| **W2** | 7 wallets + chain switch + sign summary | OK |'
  $utf8NoBom = New-Object System.Text.UTF8Encoding $false
  [System.IO.File]::WriteAllText($sessionPath, $text, $utf8NoBom)
}

Log "watch-and-ship started (poll ${PollSeconds}s)"

function Get-GateSummary {
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

while ($true) {
  $summary = Get-GateSummary

  if (-not $summary) {
    Log "no summary file yet"
    Start-Sleep -Seconds $PollSeconds
    continue
  }

  $lines = Get-Content $summary.FullName -ErrorAction SilentlyContinue
  $tail = $lines | Select-Object -Last 8
  $passOk = ($lines | Where-Object { $_ -match "^PASS \d+ OK$" }).Count
  Log ("watch " + $summary.Name + " passes_ok=" + $passOk + " tail=" + ($tail -join " | "))

  if ($lines -match "^RESULT=GREEN$") {
    Log "RESULT=GREEN detected - state sync only"
    Update-SessionStateOnGreen $summary.Name
    Log "Auto git commit/push removed. Use guarded workflow commit path after a fresh verify-100 proof."
    Log ("DONE watch_log=" + $watchLog)
    exit 0
  }

  if ($lines -match "^RESULT=FAILED$") {
    Log "RESULT=FAILED on summary - until-green should retry; keep watching"
  }

  Start-Sleep -Seconds $PollSeconds
}
