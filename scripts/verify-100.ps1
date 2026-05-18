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

Remove-Item $summary, $log -ErrorAction SilentlyContinue
"ION DEX 100-pass verification" | Set-Content -Path $summary -Encoding utf8
("ITERATIONS=" + $Iterations) | Add-Content -Path $summary -Encoding utf8
("LOG=" + $log) | Add-Content -Path $summary -Encoding utf8

$passed = 0
$failed = 0

for ($i = 1; $i -le $Iterations; $i++) {
  Write-Log ("PASS " + $i + "/" + $Iterations)

  Set-Location $root
  $encodingExit = Run-Step "encoding" {
    powershell.exe -NoProfile -ExecutionPolicy Bypass -File (Join-Path $root "scripts\check-encoding.ps1")
  }

  Set-Location $backend
  $backendVerifyExit = Run-Step "backend-verify" {
    cmd.exe /d /c "npm run verify"
  }

  $backendAuditExit = Run-Step "backend-audit-high" {
    cmd.exe /d /c "npm run audit:high"
  }

  $backendStressExit = Run-Step "backend-stress" {
    cmd.exe /d /c "npm run stress"
  }

  Set-Location $frontend
  $verifyExit = Run-Step "frontend-verify" {
    cmd.exe /d /c "npm run verify"
  }

  $auditExit = Run-Step "frontend-audit-high" {
    cmd.exe /d /c "npm run audit:high"
  }

  if ($encodingExit -eq 0 -and $backendVerifyExit -eq 0 -and $backendAuditExit -eq 0 -and $backendStressExit -eq 0 -and $verifyExit -eq 0 -and $auditExit -eq 0) {
    $passed++
    Add-Content -Path $summary -Value ("PASS " + $i + " OK") -Encoding utf8
  }
  else {
    $failed++
    $failureLine = "PASS " + $i + " FAILED encoding=" + $encodingExit + " backendVerify=" + $backendVerifyExit + " backendAudit=" + $backendAuditExit + " backendStress=" + $backendStressExit + " frontendVerify=" + $verifyExit + " frontendAudit=" + $auditExit
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
