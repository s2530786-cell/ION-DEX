param(
  [int]$Iterations = 100,
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

function Write-Log {
  param([string]$Message)
  $line = "[" + (Get-Date -Format "s") + "] " + $Message
  Write-Host $line
  Add-Content -Path $log -Value $line -Encoding utf8
}

function Run-Step {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  Write-Log ("START " + $Name)
  $previousErrorActionPreference = $ErrorActionPreference
  $ErrorActionPreference = "Continue"
  try {
    & $Command *>> $log
    $exitCode = $LASTEXITCODE
  }
  finally {
    $ErrorActionPreference = $previousErrorActionPreference
  }
  if ($null -eq $exitCode) {
    $exitCode = 0
  }
  Write-Log ("END " + $Name + " EXIT=" + $exitCode)
  return $exitCode
}

function Run-StepResilient {
  param(
    [string]$Name,
    [scriptblock]$Command
  )

  # -1073741502 == native 0xC0000142 (STATUS_DLL_INIT_FAILED): seen from nested cmd/npm
  # inside Cursor/agent shells — often transient; retry once before failing the pass.
  $transientCodes = @(-1073741502)

  $code = Run-Step -Name $Name -Command $Command
  foreach ($tc in $transientCodes) {
    if ($code -eq $tc) {
      Write-Log ("RETRY_TRANSIENT name=" + $Name + " firstExit=" + $code + " sleepMs=1800")
      Start-Sleep -Milliseconds 1800
      return Run-Step -Name ($Name + "-retry1") -Command $Command
    }
  }

  return $code
}

Remove-Item $summary, $log -ErrorAction SilentlyContinue
"ION DEX 100-pass verification" | Set-Content -Path $summary -Encoding utf8
("ITERATIONS=" + $Iterations) | Add-Content -Path $summary -Encoding utf8
("LOG=" + $log) | Add-Content -Path $summary -Encoding utf8

$passed = 0
$failed = 0

for ($i = 1; $i -le $Iterations; $i++) {
  Write-Log ("PASS " + $i + "/" + $Iterations)

  Set-Location $root
  $funcExit = Run-StepResilient "dual-chain-audit" {
    cmd.exe /d /c "node scripts\dual-chain-audit.mjs"
  }

  Set-Location $root
  $encodingScript = Join-Path $root "scripts\check-encoding.ps1"
  $encodingExit = Run-StepResilient "encoding" {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File $encodingScript
  }
  if ($encodingExit -ne 0) {
    Write-Log ("RETRY_ENCODING_AFTER_FAIL firstExit=" + $encodingExit + " sleepMs=400")
    Start-Sleep -Milliseconds 400
    $encodingExit = Run-Step -Name "encoding-retry-final" -Command {
      powershell.exe -NoProfile -ExecutionPolicy Bypass -File $encodingScript
    }
  }

  Set-Location $backend
  $backendVerifyExit = Run-StepResilient "backend-verify" {
    cmd.exe /d /c "npm run verify"
  }

  $backendAuditExit = Run-StepResilient "backend-audit-high" {
    cmd.exe /d /c "npm run audit:high"
  }

  $backendStressExit = Run-StepResilient "backend-stress" {
    cmd.exe /d /c "npm run stress"
  }
  if ($backendStressExit -ne 0) {
    Write-Log ("RETRY_BACKEND_STRESS_AFTER_FAIL firstExit=" + $backendStressExit + " sleepMs=2000")
    Start-Sleep -Milliseconds 2000
    $backendStressExit = Run-StepResilient "backend-stress-retry-final" {
      cmd.exe /d /c "npm run stress"
    }
  }

  Set-Location $frontend
  $verifyExit = Run-StepResilient "frontend-verify" {
    cmd.exe /d /c "npm run verify"
  }

  $auditExit = Run-StepResilient "frontend-audit-high" {
    cmd.exe /d /c "npm run audit:high"
  }

  if ($funcExit -eq 0 -and $encodingExit -eq 0 -and $backendVerifyExit -eq 0 -and $backendAuditExit -eq 0 -and $backendStressExit -eq 0 -and $verifyExit -eq 0 -and $auditExit -eq 0) {
    $passed++
    Add-Content -Path $summary -Value ("PASS " + $i + " OK") -Encoding utf8
  }
  else {
    $failed++
    $failureLine = "PASS " + $i + " FAILED dualChainAudit=" + $funcExit + " encoding=" + $encodingExit + " backendVerify=" + $backendVerifyExit + " backendAudit=" + $backendAuditExit + " backendStress=" + $backendStressExit + " frontendVerify=" + $verifyExit + " frontendAudit=" + $auditExit
    Add-Content -Path $summary -Value $failureLine -Encoding utf8
    Write-Log $failureLine
    if (-not $ContinueOnFailure) {
      break
    }
  }
}

Set-Location $root
("PASSED=" + $passed) | Add-Content -Path $summary -Encoding utf8
("FAILED=" + $failed) | Add-Content -Path $summary -Encoding utf8

if ($failed -eq 0 -and $passed -eq $Iterations) {
  Add-Content -Path $summary -Value "RESULT=GREEN" -Encoding utf8
  Write-Log "RESULT=GREEN"
  exit 0
}

Add-Content -Path $summary -Value "RESULT=FAILED" -Encoding utf8
Write-Log "RESULT=FAILED"
exit 1
