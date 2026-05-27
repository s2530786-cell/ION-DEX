@echo off
REM ION DEX autonomous agent entry — no pause, non-interactive verify
setlocal
cd /d "%~dp0.."
set ION_VERIFY_NONINTERACTIVE=1
set ION_AGENT_AUTONOMOUS=1

if "%~1"=="" (
  echo Usage: agent-autonomous-run.cmd ^<gate^> [extra args]
  echo   verify-full ^| verify-100 ^| dev-preflight ^| security-1000
  echo   stress-e2e --spec e2e/foo.spec.ts
  echo   stress-forge --match-contract Name
  exit /b 2
)

node scripts\autonomous-phase-gate.mjs --gate %*
set EXIT=%ERRORLEVEL%
if %EXIT% neq 0 (
  echo agent-autonomous-run: gate failed exit=%EXIT%
  exit /b %EXIT%
)
echo agent-autonomous-run: gate passed
exit /b 0
