@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
REM 1) FunC sanity: all contracts/ion sources + probes (must exit 0)
if exist "scripts\compile-func.mjs" (
  node scripts\compile-func.mjs
  if errorlevel 1 exit /b 1
)
REM 2) Full repo verification (encoding, backend, frontend, audits)
if not exist "scripts\agent-verify.cmd" exit /b 0
call scripts\agent-verify.cmd
exit /b %ERRORLEVEL%
