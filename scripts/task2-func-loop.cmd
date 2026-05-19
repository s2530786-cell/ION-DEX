@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
REM ION autonomous Task 2 loop: compile FunC gate -> baseline verify -> optional 100-pass.
REM Usage:
REM   scripts\task2-func-loop.cmd
REM   scripts\task2-func-loop.cmd --with-100
set WITH100=0
if /i "%~1"=="--with-100" set WITH100=1

echo === 1^) compile-func.mjs ===
node scripts\compile-func.mjs
if errorlevel 1 exit /b 1

echo === 2^) agent-verify ^(encoding + backend + frontend^) ===
if not exist "scripts\agent-verify.cmd" (
  echo missing scripts\agent-verify.cmd >&2
  exit /b 1
)
call scripts\agent-verify.cmd
if errorlevel 1 exit /b 1

if "%WITH100%"=="1" (
  echo === 3^) verify-100.ps1 ^(long^) ===
  powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-100.ps1
  if errorlevel 1 exit /b 1
)

echo TASK2 LOOP OK
