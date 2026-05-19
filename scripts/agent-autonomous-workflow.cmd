@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo [ION] Step 0: automation preflight
node scripts\automation-preflight.mjs
if errorlevel 1 exit /b 1

echo [ION] Step 2: FunC compile + contract test gate (P0-2)
node scripts\func-contract-test.mjs
if errorlevel 1 exit /b 1

echo [ION] Step 5: agent-verify (encoding + backend + frontend)
call scripts\agent-verify.cmd
exit /b %ERRORLEVEL%
