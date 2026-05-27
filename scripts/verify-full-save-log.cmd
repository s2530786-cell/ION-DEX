@echo off
setlocal EnableExtensions EnableDelayedExpansion
echo VERIFY-FULL-SAVE-LOG starting

rem Args: optional --no-pause (agents / CI). Also respects CI / ION_VERIFY_NONINTERACTIVE.
set "_ION_VNP="
if /i "%~1"=="--no-pause" set "_ION_VNP=1"
if defined CI set "_ION_VNP=1"
if /i "%ION_VERIFY_NONINTERACTIVE%"=="1" set "_ION_VNP=1"

cd /d "%~dp0.."
if errorlevel 1 (
  echo ERROR: could not change to repo root.
  if not defined _ION_VNP pause
  exit /b 1
)
set "ION_VERIFY_LOG=%TEMP%\ion-verify-full.txt"
del "%ION_VERIFY_LOG%" 2>nul
if exist "%ION_VERIFY_LOG%" (
  for /f %%I in ('powershell -NoProfile -Command "Get-Date -Format yyyyMMdd-HHmmss"') do set "_ION_LOG_STAMP=%%I"
  set "ION_VERIFY_LOG=%TEMP%\ion-verify-full-!_ION_LOG_STAMP!.txt"
  echo WARN: %TEMP%\ion-verify-full.txt locked; using !ION_VERIFY_LOG!
)
set ION_VERIFY_NONINTERACTIVE=1
call scripts\verify-full.cmd >>"%ION_VERIFY_LOG%" 2>&1
set VERIFY_ERR=%ERRORLEVEL%
echo AFTER ERRORLEVEL=%VERIFY_ERR%
echo ---------- log: %ION_VERIFY_LOG% ----------
type "%ION_VERIFY_LOG%"
if not defined _ION_VNP pause
exit /b %VERIFY_ERR%
