param(
  [int]$Iterations = 100,
  [int]$StartAt = 1,
  [int]$InitialPassed = 0,
  [string]$ResumeSummary = "",
  [string]$ResumeLog = "",
  [switch]$ContinueOnFailure
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$summary = Join-Path $env:TEMP "ion-verify-100-summary-$stamp.txt"
$log = Join-Path $env:TEMP "ion-verify-100-$stamp.log"

Set-Location $root

# Agent/sandbox shells may omit System32 from PATH; resolve cmd/powershell explicitly.
$sysRoot = if ($env:SystemRoot) { $env:SystemRoot } else { "C:\Windows" }
$script:System32 = Join-Path $sysRoot "System32"
$script:WinPs = Join-Path $script:System32 "WindowsPowerShell\v1.0"
$script:CmdExe = Join-Path $script:System32 "cmd.exe"
$script:PsExe = Join-Path $script:WinPs "powershell.exe"
$script:Utf8NoBom = New-Object System.Text.UTF8Encoding $false
if ($env:PATH -notlike "*$($script:System32)*") {
  $env:PATH = "$($script:System32);$($script:WinPs);$env:PATH"
}

function Append-Utf8NoBom {
  param(
    [string]$Path,
    [string]$Value
  )
  [System.IO.File]::AppendAllText($Path, $Value + "`n", $script:Utf8NoBom)
}

function Write-Utf8NoBom {
  param(
    [string]$Path,
    [string[]]$Lines
  )
  $text = ($Lines -join "`n")
  if ($Lines.Count -gt 0) {
    $text += "`n"
  }
  [System.IO.File]::WriteAllText($Path, $text, $script:Utf8NoBom)
}

function Write-Log {
  param([string]$Message)
  $line = "[" + (Get-Date -Format "s") + "] " + $Message
  Write-Host $line
  try {
    Append-Utf8NoBom -Path $log -Value $line
  }
  catch {
    if (-not $script:LogFallback) {
      $script:LogFallback = Join-Path $env:TEMP ("ion-verify-100-fallback-" + $stamp + ".log")
      $log = $script:LogFallback
      try {
        Append-Utf8NoBom -Path $summary -Value ("LOG_FALLBACK=" + $log)
      }
      catch {}
    }
    Append-Utf8NoBom -Path $log -Value $line
  }
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  Write-Log ("START " + $Name)
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  $exitCode = 1
  try {
    & $Command *>> $log
    if ($null -ne $LASTEXITCODE) {
      $exitCode = [int]$LASTEXITCODE
    }
  }
  catch {
    Write-Log ("ERROR " + $Name + " " + $_.Exception.Message)
    $exitCode = 1
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  Write-Log ("END " + $Name + " EXIT=" + $exitCode)
  return $exitCode
}

function Invoke-NpmVerify {
  param([string]$WorkingDirectory)
  Set-Location $WorkingDirectory
  & $script:CmdExe /d /c "npm run verify & exit /b %ERRORLEVEL%"
}

function Invoke-NpmAuditHigh {
  param([string]$WorkingDirectory)
  Set-Location $WorkingDirectory
  & $script:CmdExe /d /c "npm run audit:high & exit /b %ERRORLEVEL%"
}

$lockFile = Join-Path $env:TEMP "ion-verify-100.lock"
if (Test-Path $lockFile) {
  $lockAge = (Get-Date) - (Get-Item $lockFile).LastWriteTime
  if ($lockAge.TotalHours -lt 6) {
    Write-Host "Another verify-100 appears to be running (lock: $lockFile). Aborting to avoid port/E2E races."
    exit 2
  }
  Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
New-Item -Path $lockFile -ItemType File -Force | Out-Null

if ($ResumeSummary -and (Test-Path $ResumeSummary)) {
  $summary = $ResumeSummary
}
if ($ResumeLog -and (Test-Path $ResumeLog)) {
  try {
    Append-Utf8NoBom -Path $ResumeLog -Value ("--- RESUME " + (Get-Date -Format "s") + " ---")
    $log = $ResumeLog
  }
  catch {
    $log = Join-Path $env:TEMP ("ion-verify-100-resume-" + $stamp + ".log")
  }
}

if ($ResumeSummary -and (Test-Path $summary)) {
  Write-Log ("RESUME summary=" + $summary + " startAt=" + $StartAt + " initialPassed=" + $InitialPassed)
} else {
  Remove-Item $summary, $log -ErrorAction SilentlyContinue
  Write-Utf8NoBom -Path $summary -Lines @(
    "ION DEX 100-pass verification",
    "ITERATIONS=$Iterations",
    "LOG=$log"
  )
}

if ($StartAt -lt 1) { $StartAt = 1 }
if ($StartAt -gt $Iterations) {
  Write-Host "StartAt ($StartAt) > Iterations ($Iterations); nothing to run."
  exit 0
}

$passed = [Math]::Max(0, $InitialPassed)
$failed = 0

for ($i = $StartAt; $i -le $Iterations; $i++) {
  Write-Log ("PASS " + $i + "/" + $Iterations)

  Set-Location $root
  $encodingExit = Run-Step "encoding" {
    & $script:PsExe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts\check-encoding.ps1")
  }

  Set-Location $root
  $ipLeakExit = Run-Step "public-ip-leak" {
    & $script:CmdExe /d /c "node scripts\check-public-ip-leak.mjs --all & exit /b %ERRORLEVEL%"
  }

  Set-Location $backend
  $backendVerifyExit = Run-Step "backend-verify" {
    Invoke-NpmVerify -WorkingDirectory $backend
  }
  if ($backendVerifyExit -ne 0) {
    Set-Location $root
    Run-Step "free-ion-ports-before-backend-retry" {
      & $script:CmdExe /d /c "node scripts\free-ion-ports.mjs & exit /b 0"
    } | Out-Null
    Start-Sleep -Seconds 2
    Set-Location $backend
    $backendVerifyExit = Run-Step "backend-verify-retry" {
      Invoke-NpmVerify -WorkingDirectory $backend
    }
  }

  if ($backendVerifyExit -eq 0) {
    Set-Location $backend
    $backendAuditExit = Run-Step "backend-audit-high" {
      & $script:CmdExe /d /c "npm run audit:high"
    }

    $backendStressExit = Run-Step "backend-stress" {
      & $script:CmdExe /d /c "npm run stress"
    }
  }
  else {
    $backendAuditExit = 1
    $backendStressExit = 1
  }

  Set-Location $root
  Run-Step "free-ion-ports" {
    & $script:CmdExe /d /c "node scripts\free-ion-ports.mjs & exit /b 0"
  } | Out-Null
  Start-Sleep -Seconds 2

  Set-Location $frontend
  $verifyExit = Run-Step "frontend-verify" {
    Invoke-NpmVerify -WorkingDirectory $frontend
  }
  if ($verifyExit -ne 0) {
    Write-Log "frontend-verify failed; waiting for preview/backend teardown before retry"
    Start-Sleep -Seconds 8
    Set-Location $frontend
    $verifyExit = Run-Step "frontend-verify-retry" {
      Invoke-NpmVerify -WorkingDirectory $frontend
    }
    if ($verifyExit -ne 0) {
      Start-Sleep -Seconds 8
      Set-Location $frontend
      $verifyExit = Run-Step "frontend-verify-retry2" {
        Invoke-NpmVerify -WorkingDirectory $frontend
      }
    }
  }

  if ($verifyExit -eq 0) {
    $auditExit = Run-Step "frontend-audit-high" {
      Invoke-NpmAuditHigh -WorkingDirectory $frontend
    }
  }
  else {
    Write-Log "Skipping frontend-audit-high because frontend-verify did not pass"
    $auditExit = 1
  }

  if ($encodingExit -eq 0 -and $ipLeakExit -eq 0 -and $backendVerifyExit -eq 0 -and $backendAuditExit -eq 0 -and $backendStressExit -eq 0 -and $verifyExit -eq 0 -and $auditExit -eq 0) {
    $passed++
    Append-Utf8NoBom -Path $summary -Value ("PASS " + $i + " OK")
    Write-Host ("*** PASS " + $i + " OK (" + $passed + "/" + $Iterations + " green) ***")
  }
  else {
    $failed++
    $failureLine = "PASS " + $i + " FAILED encoding=" + $encodingExit + " ipLeak=" + $ipLeakExit + " backendVerify=" + $backendVerifyExit + " backendAudit=" + $backendAuditExit + " backendStress=" + $backendStressExit + " frontendVerify=" + $verifyExit + " frontendAudit=" + $auditExit
    Append-Utf8NoBom -Path $summary -Value $failureLine
    Write-Log $failureLine
    if (-not $ContinueOnFailure) {
      break
    }
  }
}

Set-Location $root
Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
Append-Utf8NoBom -Path $summary -Value ("PASSED=" + $passed)
Append-Utf8NoBom -Path $summary -Value ("FAILED=" + $failed)

if ($failed -eq 0 -and $passed -eq $Iterations) {
  Append-Utf8NoBom -Path $summary -Value "RESULT=GREEN"
  Write-Log "RESULT=GREEN"
  Set-Location $root
  $recordArgs = @(
    (Join-Path $root "scripts\verify-100-gate.mjs"),
    "record",
    "--summary",
    $summary
  )
  if ($env:ION_WORKFLOW_STAGE) {
    $recordArgs += @("--stage", $env:ION_WORKFLOW_STAGE)
  }
  if ($env:ION_WORKFLOW_QUEUE_ID) {
    $recordArgs += @("--queue", $env:ION_WORKFLOW_QUEUE_ID)
  }
  if ($env:ION_WORKFLOW_STEP_ID) {
    $recordArgs += @("--step", $env:ION_WORKFLOW_STEP_ID)
  }
  if ($env:ION_WORKFLOW_ACTIVATED_AT) {
    $recordArgs += @("--activated-at", $env:ION_WORKFLOW_ACTIVATED_AT)
  }
  & node $recordArgs
  if ($LASTEXITCODE -ne 0) {
    Write-Log ("ERROR verify-100-gate record failed exit=" + $LASTEXITCODE)
    Append-Utf8NoBom -Path $summary -Value "RESULT=FAILED"
    exit 1
  }
  if ($env:ION_AGENT_AUTONOMOUS -eq "1") {
    Write-Log "AUTO-ADVANCE: trigger watchdog (commit+push -> Batch C/D -> stress)"
    Set-Location $root
    & node (Join-Path $root "scripts\autonomous-work-watchdog.mjs") --once
  }
  exit 0
}

Append-Utf8NoBom -Path $summary -Value "RESULT=FAILED"
Write-Log "RESULT=FAILED"
exit 1
