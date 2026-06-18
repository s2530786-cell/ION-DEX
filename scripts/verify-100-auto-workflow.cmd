@echo off

setlocal EnableExtensions

cd /d "%~dp0.."

set ION_VERIFY_NONINTERACTIVE=1
set ION_AGENT_AUTONOMOUS=1
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"

echo [auto] free ports + clear stale verify-100 lock
node scripts\free-ion-ports.mjs
if exist "%TEMP%\ion-verify-100.lock" del /f /q "%TEMP%\ion-verify-100.lock" 2>nul

echo [auto] start watchdog daemon
start "ion-watchdog" /B node scripts\autonomous-work-watchdog.mjs --daemon --interval 60

echo [auto] trigger watchdog once
node scripts\autonomous-work-watchdog.mjs --once
set "TICK_EXIT=%ERRORLEVEL%"
if not "%TICK_EXIT%"=="0" if not "%TICK_EXIT%"=="1" (
  echo [auto] watchdog once failed exit=%TICK_EXIT%
  exit /b %TICK_EXIT%
)

echo [auto] start verify-100 watch-and-ship foreground
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "scripts\verify-100-watch-and-ship.ps1"
set "EXIT_CODE=%ERRORLEVEL%"

echo [auto] workflow exit=%EXIT_CODE%
exit /b %EXIT_CODE%
