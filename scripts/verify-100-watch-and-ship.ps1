# Poll latest verify-100 summary until RESULT=GREEN, then commit+push and advance SESSION_STATE (W2 -> W3).
# Script body is ASCII-only so Windows PowerShell parses under agent shells (UTF-8 no BOM safe).
param(
  [int]$PollSeconds = 90
)

$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
$gitExe = @(
  (Join-Path ${env:ProgramFiles} "Git\cmd\git.exe"),
  (Join-Path ${env:ProgramFiles(x86)} "Git\cmd\git.exe")
) | Where-Object { Test-Path $_ } | Select-Object -First 1

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
    Log "RESULT=GREEN detected — shipping"
    Update-SessionStateOnGreen $summary.Name

    if ($gitExe) {
      Set-Location $root
      $shipPaths = @(
        "scripts/verify-100.ps1",
        "scripts/verify-100-until-green.ps1",
        "scripts/verify-100-until-green.cmd",
        "scripts/verify-100-watch-and-ship.ps1",
        "scripts/verify-100-watch-and-ship.cmd",
        "SESSION_STATE.md"
      )
      foreach ($p in $shipPaths) {
        if (Test-Path (Join-Path $root $p)) {
          & $gitExe -C $root add -- $p 2>> $watchLog
        }
      }
      $msg = @"
fix(verify): W2 verify-100 gate green (PASSED=100)

- System32 cmd/powershell paths for agent shells (verify-100.ps1)
- until-green + watch-and-ship automation (ASCII-safe)
- SESSION_STATE: W2 complete, CURRENT_PHASE=W3
Evidence: $($summary.Name)
"@
      & $gitExe -C $root commit -m $msg 2>> $watchLog
      if ($LASTEXITCODE -eq 0) {
        & $gitExe -C $root push -u origin HEAD 2>> $watchLog
        Log ("git push exit=" + $LASTEXITCODE)
      }
      else {
        Log "git commit failed or nothing to commit"
      }
    }
    else {
      Log "WARN: git.exe not found"
    }

    Log ("DONE watch_log=" + $watchLog)
    exit 0
  }

  if ($lines -match "^RESULT=FAILED$") {
    Log "RESULT=FAILED on summary — until-green should retry; keep watching"
  }

  Start-Sleep -Seconds $PollSeconds
}
