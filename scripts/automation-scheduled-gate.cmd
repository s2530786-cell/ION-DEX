@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

REM Unified scheduled / manual automation entry.
REM Modes: quick | standard | iron | verify100 | dual100
REM   quick     - preflight + func-contract-test + agent-verify (~5-15 min)
REM   standard  - quick + dual-chain-audit (~25-35 min)
REM   iron      - iron-law-security (stress + ION 1500 + BSC 1500)
REM   verify100 - verify-100.ps1 full stack + E2E x100 (hours)
REM   dual100   - verify-100-dual-chain.ps1 x100 (hours)

if not defined ION_AUTO_MODE set ION_AUTO_MODE=quick
set ION_VERIFY_NONINTERACTIVE=1
set STAMP=%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set STAMP=%STAMP: =0%
set LOG=%TEMP%\ion-auto-gate-%ION_AUTO_MODE%-%STAMP%.log
set SUMMARY=%TEMP%\ion-auto-gate-%ION_AUTO_MODE%-latest.txt

echo [ION] automation-scheduled-gate mode=%ION_AUTO_MODE% > "%LOG%"
echo LOG=%LOG%>>"%SUMMARY%"
echo MODE=%ION_AUTO_MODE%>>"%SUMMARY%"
echo START=%date% %time%>>"%SUMMARY%"

call :run_gate
set ERR=%ERRORLEVEL%
echo END exit=%ERR%>>"%SUMMARY%"
echo LOG=%LOG%>>"%SUMMARY%"
if %ERR% neq 0 (
  echo RESULT=FAILED>>"%SUMMARY%"
  exit /b %ERR%
)
echo RESULT=GREEN>>"%SUMMARY%"
exit /b 0

:run_gate
if /I "%ION_AUTO_MODE%"=="quick" goto :quick
if /I "%ION_AUTO_MODE%"=="standard" goto :standard
if /I "%ION_AUTO_MODE%"=="iron" goto :iron
if /I "%ION_AUTO_MODE%"=="verify100" goto :verify100
if /I "%ION_AUTO_MODE%"=="dual100" goto :dual100
echo Unknown ION_AUTO_MODE=%ION_AUTO_MODE%>>"%LOG%"
exit /b 2

:quick
call scripts\agent-autonomous-workflow.cmd >>"%LOG%" 2>&1
exit /b %ERRORLEVEL%

:standard
call scripts\agent-autonomous-workflow.cmd >>"%LOG%" 2>&1
if errorlevel 1 exit /b 1
node scripts\dual-chain-audit.mjs >>"%LOG%" 2>&1
exit /b %ERRORLEVEL%

:iron
call scripts\iron-law-security.cmd >>"%LOG%" 2>&1
exit /b %ERRORLEVEL%

:verify100
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-100.ps1 >>"%LOG%" 2>&1
exit /b %ERRORLEVEL%

:dual100
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\verify-100-dual-chain.ps1 >>"%LOG%" 2>&1
exit /b %ERRORLEVEL%
