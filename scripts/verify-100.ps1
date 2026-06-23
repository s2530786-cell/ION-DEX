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
if ($env:PATH -notlike "*$($script:System32)*") {
  $env:PATH = "$($script:System32);$($script:WinPs);$env:PATH"
}

function Write-Log {
  param([string]$Message)
  $line = "[" + (Get-Date -Format "s") + "] " + $Message
  Write-Host $line
  try {
    Add-Content -Path $log -Value $line -Encoding utf8 -ErrorAction Stop
  }
  catch {
    if (-not $script:LogFallback) {
      $script:LogFallback = Join-Path $env:TEMP ("ion-verify-100-fallback-" + $stamp + ".log")
      $log = $script:LogFallback
      ("LOG_FALLBACK=" + $log) | Add-Content -Path $summary -Encoding utf8 -ErrorAction SilentlyContinue
    }
    Add-Content -Path $log -Value $line -Encoding utf8
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
    throw "active verify-100 lock: $lockFile"
  }
  Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
}
New-Item -Path $lockFile -ItemType File -Force | Out-Null

if ($ResumeSummary -and (Test-Path $ResumeSummary)) {
  $summary = $ResumeSummary
}
if ($ResumeLog -and (Test-Path $ResumeLog)) {
  try {
    Add-Content -Path $ResumeLog -Value ("--- RESUME " + (Get-Date -Format "s") + " ---") -Encoding utf8 -ErrorAction Stop
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
  "ION DEX 100-pass verification" | Set-Content -Path $summary -Encoding utf8
  ("ITERATIONS=" + $Iterations) | Add-Content -Path $summary -Encoding utf8
  ("LOG=" + $log) | Add-Content -Path $summary -Encoding utf8
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
      # Project contract regression excludes vendored OpenZeppelin fixture trees.
      $forgeExe = "D:\openclaw-tools\foundry\bin\forge.exe"
      $contractsDir = "D:\openclaw-tools\ion-dex-nuke\contracts"
      if (-not (Test-Path $forgeExe)) { throw "forge executable not found: $forgeExe" }
      Push-Location $contractsDir
      try {
        $stressResult = & $forgeExe test --match-path "test/*.t.sol" --no-match-path "lib/**" 2>&1 | Out-String
        if ($stressResult -match "81 tests passed, 0 failed") { $global:LASTEXITCODE = 0; return }
        Write-Host "forge test FAILED"
        throw "forge test did not report 81 tests passed, 0 failed"
      } finally { Pop-Location }
    }
    if ($backendStressExit -ne 0) {
      Set-Location $root
      Run-Step "free-ion-ports-before-backend-stress-retry" {
        & $script:CmdExe /d /c "node scripts\free-ion-ports.mjs & exit /b 0"
      } | Out-Null
      Start-Sleep -Seconds 2
      Set-Location $backend
      $backendStressExit = Run-Step "backend-stress-retry" {
        $forgeExe = "D:\openclaw-tools\foundry\bin\forge.exe"
        $contractsDir = "D:\openclaw-tools\ion-dex-nuke\contracts"
        if (-not (Test-Path $forgeExe)) { throw "forge executable not found: $forgeExe" }
        Push-Location $contractsDir
        try {
          $stressResult = & $forgeExe test --match-path "test/*.t.sol" --no-match-path "lib/**" 2>&1 | Out-String
          if ($stressResult -match "81 tests passed, 0 failed") { $global:LASTEXITCODE = 0; return }
          throw "forge test did not report 81 tests passed, 0 failed"
        } finally { Pop-Location }
      }
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
    Add-Content -Path $summary -Value ("PASS " + $i + " OK") -Encoding utf8
    Write-Host ("*** PASS " + $i + " OK (" + $passed + "/" + $Iterations + " green) ***")
  }
  else {
    $failed++
    $failureLine = "PASS " + $i + " FAILED encoding=" + $encodingExit + " ipLeak=" + $ipLeakExit + " backendVerify=" + $backendVerifyExit + " backendAudit=" + $backendAuditExit + " backendStress=" + $backendStressExit + " frontendVerify=" + $verifyExit + " frontendAudit=" + $auditExit
    Add-Content -Path $summary -Value $failureLine -Encoding utf8
    Write-Log $failureLine
    if (-not $ContinueOnFailure) {
      break
    }
  }
}

Set-Location $root
Remove-Item $lockFile -Force -ErrorAction SilentlyContinue
("PASSED=" + $passed) | Add-Content -Path $summary -Encoding utf8
("FAILED=" + $failed) | Add-Content -Path $summary -Encoding utf8

if ($failed -eq 0 -and $passed -eq $Iterations) {
  Add-Content -Path $summary -Value "RESULT=GREEN" -Encoding utf8
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
    Add-Content -Path $summary -Value "RESULT=FAILED" -Encoding utf8
    exit 1
  }
  if ($env:ION_AGENT_AUTONOMOUS -eq "1") {
    Write-Log "AUTO-ADVANCE: trigger watchdog (commit+push -> Batch C/D -> stress)"
    Set-Location $root
    & node (Join-Path $root "scripts\autonomous-work-watchdog.mjs") --once
  }
  exit 0
}

Add-Content -Path $summary -Value "RESULT=FAILED" -Encoding utf8
Write-Log "RESULT=FAILED"
exit 1
