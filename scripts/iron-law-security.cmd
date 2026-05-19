@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set ROOT=%CD%
set FORGE=D:\openclaw-tools\foundry\bin\forge.exe
if not exist "%FORGE%" set FORGE=forge

echo.
echo ========================================================
echo  ION DEX Iron Law Security Suite
echo  - Backend stress (API gateway)
echo  - ION FunC: func-security-audit 15 x 100 = 1500
echo  - BSC SecurityAttackTest: 15 categories x 100 = 1500
echo  - Category 15: Post-quantum resistance (both chains)
echo ========================================================
echo.

set ION_VERIFY_NONINTERACTIVE=1
set ERR=0

echo === [1/3] Backend stress ===
pushd "%ROOT%\backend"
call npm run build
if errorlevel 1 set ERR=1 & goto :fail
if "%ION_STRESS_PROFILE%"=="heavy" (
  set ION_STRESS_REQUESTS=500
  set ION_STRESS_CONCURRENCY=48
) else (
  if not defined ION_STRESS_REQUESTS set ION_STRESS_REQUESTS=120
  if not defined ION_STRESS_CONCURRENCY set ION_STRESS_CONCURRENCY=24
)
node scripts/stress.mjs
if errorlevel 1 set ERR=1 & goto :fail
popd

echo.
echo === [2/4] ION FunC gates (compile + contract + 1500 security) ===
node "%ROOT%\scripts\compile-func.mjs"
if errorlevel 1 set ERR=1 & goto :fail
node "%ROOT%\scripts\func-contract-test.mjs"
if errorlevel 1 set ERR=1 & goto :fail
node "%ROOT%\scripts\func-security-audit.mjs"
if errorlevel 1 set ERR=1 & goto :fail

echo.
echo === [3/4] BSC SecurityAttackTest (1500 + quantum) ===
pushd "%ROOT%\contracts\bsc"
"%FORGE%" build
if errorlevel 1 set ERR=1 & goto :fail
"%FORGE%" test --match-contract SecurityAttackTest --summary
if errorlevel 1 set ERR=1 & goto :fail
popd

echo.
echo ========================================================
echo  ALL GREEN: stress + ION 1500 + BSC 1500 security iterations
echo ========================================================
goto :end

:fail
echo.
echo ========================================================
echo  FAILED — fix and re-run: scripts\iron-law-security.cmd
echo ========================================================
exit /b 1

:end
exit /b %ERR%
