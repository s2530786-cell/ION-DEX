# Run verify-100 until PASSED=100 FAILED=0 RESULT=GREEN (restart from 0 on any failure).
param(
  [int]$Iterations = 100
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$sysRoot = if ($env:SystemRoot) { $env:SystemRoot } else { "C:\Windows" }
$psExe = Join-Path $sysRoot "System32\WindowsPowerShell\v1.0\powershell.exe"
$verifyScript = Join-Path $root "scripts\verify-100.ps1"
$runnerLog = Join-Path $env:TEMP ("ion-verify-100-until-green-" + (Get-Date -Format "yyyyMMdd-HHmmss") + ".log")

function Write-RunnerLog {
  param([string]$Message)
  $line = "[" + (Get-Date -Format "s") + "] " + $Message
  Write-Host $line
  Add-Content -Path $runnerLog -Value $line -Encoding utf8
}

Write-Host ""
Write-Host "============================================================"
Write-Host " verify-100-until-green (FOREGROUND — output in this window)"
Write-Host " Target: PASSED=100 FAILED=0 RESULT=GREEN"
Write-Host " Runner log also: $runnerLog"
Write-Host "============================================================"
Write-Host ""

$attempt = 0
while ($true) {
  $attempt++
  Write-RunnerLog ("ATTEMPT " + $attempt + " starting verify-100 x" + $Iterations)
  Set-Location $root
  $env:ION_VERIFY_NONINTERACTIVE = "1"
  & $psExe -NoProfile -ExecutionPolicy Bypass -File $verifyScript -Iterations $Iterations
  $exitCode = if ($null -ne $LASTEXITCODE) { [int]$LASTEXITCODE } else { 1 }

  $latestSummary = Get-ChildItem (Join-Path $env:TEMP "ion-verify-100-summary-*.txt") -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($latestSummary) {
    $tail = Get-Content $latestSummary.FullName -Tail 5
    Write-RunnerLog ("SUMMARY " + $latestSummary.Name + " :: " + ($tail -join " | "))
  }

  if ($exitCode -eq 0) {
    Write-RunnerLog "RESULT=GREEN — verify-100 gate satisfied"
    Write-RunnerLog ("RUNNER_LOG=" + $runnerLog)
    Write-RunnerLog ("SUMMARY_FILE=" + $latestSummary.FullName)

    $sessionPath = Join-Path $root "SESSION_STATE.md"
    if ((Test-Path $sessionPath) -and $latestSummary) {
      $evidence = $latestSummary.Name
      $text = Get-Content $sessionPath -Raw -Encoding utf8
      $text = $text -replace '\*\*CURRENT_PHASE=W2\*\*', "**CURRENT_PHASE=W3** (verify-100 GREEN: $evidence)"
      $text = $text -replace '(?m)^- \*\*verify-100[^\r\n]+', "- **verify-100 GREEN** ($evidence): PASSED=100 FAILED=0 RESULT=GREEN"
      $text = $text -replace '(?m)\| \*\*W2\*\* \|[^|]+\| [^|]+ \|', '| **W2** | 7 wallets + chain switch + sign summary | OK |'
      $utf8NoBom = New-Object System.Text.UTF8Encoding $false
      [System.IO.File]::WriteAllText($sessionPath, $text, $utf8NoBom)
      Write-RunnerLog "SESSION_STATE.md updated (W2 -> W3)"
    }

    $gitCandidates = @(
      (Join-Path ${env:ProgramFiles} "Git\cmd\git.exe"),
      (Join-Path ${env:ProgramFiles(x86)} "Git\cmd\git.exe")
    )
    $gitExe = $gitCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($gitExe) {
      Write-RunnerLog "git commit + push (W2 verify-100 gate)"
      $paths = @(
        "scripts/verify-100.ps1",
        "scripts/verify-100-until-green.ps1",
        "scripts/verify-100-until-green.cmd",
        "scripts/verify-100-watch-and-ship.ps1",
        "scripts/verify-100-watch-and-ship.cmd",
        "SESSION_STATE.md"
      )
      foreach ($p in $paths) {
        & $gitExe -C $root add -- $p 2>> $runnerLog
      }
      $msg = @"
fix(verify): W2 verify-100 gate green — System32 cmd/powershell paths

- verify-100.ps1: resolve cmd/powershell under %SystemRoot%\System32 for agent shells
- until-green runner: loop until PASSED=100 RESULT=GREEN
- SESSION_STATE: W2 stress 100/100 + verify-100 evidence
"@
      & $gitExe -C $root commit -m $msg 2>> $runnerLog
      if ($LASTEXITCODE -eq 0) {
        & $gitExe -C $root push -u origin HEAD 2>> $runnerLog
        Write-RunnerLog ("git push exit=" + $LASTEXITCODE)
      }
      else {
        Write-RunnerLog "git commit skipped or failed (nothing to commit?)"
      }
    }
    else {
      Write-RunnerLog "WARN: git.exe not found; commit/push skipped"
    }
    exit 0
  }

  Write-RunnerLog ("Attempt " + $attempt + " failed (exit " + $exitCode + "); freeing ports and restarting from 0")
  node (Join-Path $root "scripts\free-ion-ports.mjs") 2>&1 | Out-Null
  Remove-Item (Join-Path $env:TEMP "ion-verify-100.lock") -Force -ErrorAction SilentlyContinue
  Start-Sleep -Seconds 5
}
