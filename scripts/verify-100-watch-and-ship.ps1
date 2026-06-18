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

function Get-ActiveQueueActivatedAtMs {
  $queuePath = Join-Path $root ".memory-bank\autonomous-work-queue.json"
  if (-not (Test-Path $queuePath)) {
    return 0
  }
  try {
    $queueDoc = Get-Content $queuePath -Raw -Encoding utf8 | ConvertFrom-Json
    $active = $queueDoc.queues | Where-Object { $_.status -eq "active" } | Select-Object -First 1
    if (-not $active -or -not $active.activatedAt) {
      return 0
    }
    return [DateTimeOffset]::Parse([string]$active.activatedAt).ToUnixTimeMilliseconds()
  } catch {
    return 0
  }
}

function Test-SummaryFreshEnough($item, [Int64]$activatedAtMs) {
  if ($activatedAtMs -le 0) {
    return $true
  }
  $mtimeMs = [Int64]([DateTimeOffset]$item.LastWriteTimeUtc).ToUnixTimeMilliseconds()
  return $mtimeMs -ge ($activatedAtMs - 60000)
}

function Get-GateSummary {
  $all = Get-ChildItem (Join-Path $env:TEMP "ion-verify-100-summary-*.txt") -File -ErrorAction SilentlyContinue
  if (-not $all) {
    return $null
  }
  $activatedAtMs = Get-ActiveQueueActivatedAtMs
  $fresh = $all | Where-Object { Test-SummaryFreshEnough $_ $activatedAtMs } | Sort-Object LastWriteTime -Descending
  if (-not $fresh) {
    return $all | Sort-Object LastWriteTime -Descending | Select-Object -First 1
  }
  foreach ($item in $fresh) {
    $lines = Get-Content $item.FullName -ErrorAction SilentlyContinue
    if ($lines -match "^RESULT=GREEN$" -and ($lines -match "^PASSED=100$") -and ($lines -match "^FAILED=0$")) {
      return $item
    }
  }
  return $fresh | Select-Object -First 1
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
    Log "RESULT=GREEN detected - recording guarded proof"
    $nodeExe = "node"
    $gateScript = Join-Path $root "scripts\verify-100-gate.mjs"
    & $nodeExe $gateScript record --summary $summary.FullName --note "watch-and-ship auto flow" 2>&1 | ForEach-Object {
      Log ("gate-record> " + $_)
    }
    if ($LASTEXITCODE -ne 0) {
      Log ("verify-100 gate record failed exit=" + $LASTEXITCODE)
      exit $LASTEXITCODE
    }

    Update-SessionStateOnGreen $summary.Name

    Log "Launching watchdog once to auto-advance guarded commit/push"
    & $nodeExe (Join-Path $root "scripts\autonomous-work-watchdog.mjs") --once 2>&1 | ForEach-Object {
      Log ("watchdog> " + $_)
    }
    if ($LASTEXITCODE -ne 0) {
      Log ("watchdog auto-advance failed exit=" + $LASTEXITCODE)
      exit $LASTEXITCODE
    }

    Log ("DONE watch_log=" + $watchLog)
    exit 0
  }

  if ($lines -match "^RESULT=FAILED$") {
    Log "RESULT=FAILED on summary - until-green should retry; keep watching"
  }

  Start-Sleep -Seconds $PollSeconds
}
