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

echo === 1) Encoding check ===
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%CD%\scripts\check-encoding.ps1"
if errorlevel 1 (
  echo ERROR: encoding check failed with exit code !ERRORLEVEL!
  if not defined _ION_VNP pause
  exit /b 1
)

echo.
echo === 2) Frontend verify (build + Playwright) ===
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
echo === 3) npm audit (high) ===
pushd "%CD%\frontend"
call npm run audit:high
popd

echo.
echo OK - verify-full completed.
echo VERIFY-FULL finished
echo ========================================
endlocal
exit /b 0
