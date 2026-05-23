@echo off
setlocal EnableExtensions EnableDelayedExpansion

rem Non-interactive: no pause on errors (CI, agents, hooks).
rem Set ION_VERIFY_NONINTERACTIVE=1 or define CI.
set "_ION_VNP="
if defined CI set "_ION_VNP=1"
if /i "%ION_VERIFY_NONINTERACTIVE%"=="1" set "_ION_VNP=1"

echo.
echo VERIFY-FULL starting
echo ========================================
echo ion-dex-nuke : verify-full (CMD)
echo ========================================
echo Script: %~f0

cd /d "%~dp0.."
if errorlevel 1 (
  echo ERROR: could not cd to repo root from "%~dp0.."
  if not defined _ION_VNP pause
  exit /b 1
)

echo Repo root: %CD%
echo.

echo === 0) Development preflight ===
node "%CD%\scripts\dev-preflight.mjs"
if errorlevel 1 (
  echo ERROR: development preflight failed with exit code !ERRORLEVEL!
  if not defined _ION_VNP pause
  exit /b 1
)

echo.
echo === 1) Encoding check ===
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\check-encoding.ps1"
if errorlevel 1 (
  echo ERROR: encoding check failed with exit code !ERRORLEVEL!
  if not defined _ION_VNP pause
  exit /b 1
)

echo.
echo === 2) Contract verify (FunC + Solidity + deploy readiness) ===
node "%CD%\scripts\verify-contracts.mjs"
if errorlevel 1 (
  echo ERROR: contract verification failed with exit code !ERRORLEVEL!
  if not defined _ION_VNP pause
  exit /b 1
)

echo.
echo === 3) Backend verify (build + API tests) ===
if not exist "%CD%\backend\package.json" (
  echo ERROR: backend\package.json not found under %CD%\backend
  if not defined _ION_VNP pause
  exit /b 1
)

pushd "%CD%\backend"
call npm run verify
set BACKEND_VERIFY_ERR=!ERRORLEVEL!
if "!BACKEND_VERIFY_ERR!"=="0" (
  call npm run audit:high
  set BACKEND_AUDIT_ERR=!ERRORLEVEL!
) else (
  set BACKEND_AUDIT_ERR=1
)
if "!BACKEND_AUDIT_ERR!"=="0" (
  call npm run stress
  set BACKEND_STRESS_ERR=!ERRORLEVEL!
) else (
  set BACKEND_STRESS_ERR=1
)
popd
if not "!BACKEND_VERIFY_ERR!"=="0" (
  echo ERROR: backend npm run verify failed with exit code !BACKEND_VERIFY_ERR!
  if not defined _ION_VNP pause
  exit /b !BACKEND_VERIFY_ERR!
)
if not "!BACKEND_AUDIT_ERR!"=="0" (
  echo ERROR: backend npm run audit:high failed with exit code !BACKEND_AUDIT_ERR!
  if not defined _ION_VNP pause
  exit /b !BACKEND_AUDIT_ERR!
)
if not "!BACKEND_STRESS_ERR!"=="0" (
  echo ERROR: backend npm run stress failed with exit code !BACKEND_STRESS_ERR!
  if not defined _ION_VNP pause
  exit /b !BACKEND_STRESS_ERR!
)

echo.
echo === 4) Frontend verify (build + Playwright) ===
if not exist "%CD%\frontend\package.json" (
  echo ERROR: frontend\package.json not found under %CD%\frontend
  if not defined _ION_VNP pause
  exit /b 1
)

pushd "%CD%\frontend"
call npm run verify
set VERIFY_ERR=!ERRORLEVEL!
popd
if not "!VERIFY_ERR!"=="0" (
  echo ERROR: npm run verify failed with exit code !VERIFY_ERR!
  if not defined _ION_VNP pause
  exit /b !VERIFY_ERR!
)

echo.
echo === 5) Frontend npm audit (high) ===
pushd "%CD%\frontend"
call npm run audit:high
set FRONTEND_AUDIT_ERR=!ERRORLEVEL!
popd
if not "!FRONTEND_AUDIT_ERR!"=="0" (
  echo ERROR: frontend npm run audit:high failed with exit code !FRONTEND_AUDIT_ERR!
  if not defined _ION_VNP pause
  exit /b !FRONTEND_AUDIT_ERR!
)

echo.
echo OK - verify-full completed.
echo VERIFY-FULL finished
echo ========================================
endlocal
exit /b 0
