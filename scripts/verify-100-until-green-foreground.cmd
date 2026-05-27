@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title ION W2 verify-100 until GREEN
set "ION_VERIFY_NONINTERACTIVE=1"
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
echo.
echo ============================================================
echo   ION DEX W2 - verify-100 gate (FOREGROUND)
echo   All output in this window. Do not close until RESULT=GREEN.
echo   Typical runtime: about 3-4 hours for 100 passes.
echo   Summary: %%TEMP%%\ion-verify-100-summary-*.txt
echo ============================================================
echo.
if exist "%TEMP%\ion-verify-100.lock" (
  echo WARNING: ion-verify-100.lock exists — another run may be active.
  echo   Option A: scripts\verify-100-follow-progress.cmd  ^(watch only^)
  echo   Option B: stop the other run, delete the lock, then rerun this script.
  echo.
)
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-100-until-green.ps1"
set "EC=%ERRORLEVEL%"
echo.
echo ============================================================
echo   Finished. Exit code: %EC%
echo   Check %%TEMP%%\ion-verify-100-summary-*.txt for PASSED=100 RESULT=GREEN
echo ============================================================
if not defined ION_VERIFY_NO_PAUSE pause
exit /b %EC%
