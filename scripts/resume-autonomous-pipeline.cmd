@echo off
setlocal
cd /d "%~dp0.."
set ION_VERIFY_NONINTERACTIVE=1
set ION_AGENT_AUTONOMOUS=1

echo [resume] free ports + clear stale verify-100 lock
node scripts\free-ion-ports.mjs
if exist "%TEMP%\ion-verify-100.lock" del /f /q "%TEMP%\ion-verify-100.lock" 2>nul

echo [resume] watchdog tick (detect stall + resume verify-100)
node scripts\autonomous-work-watchdog.mjs --once

echo [resume] start daemon (60s)
start "" /B node scripts\autonomous-work-watchdog.mjs --daemon --interval 60

endlocal
