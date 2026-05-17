@echo off
setlocal EnableExtensions
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
del "%TEMP%\ion-verify-full.txt" 2>nul
set ION_VERIFY_NONINTERACTIVE=1
call scripts\verify-full.cmd >>"%TEMP%\ion-verify-full.txt" 2>&1
set VERIFY_ERR=%ERRORLEVEL%
echo AFTER ERRORLEVEL=%VERIFY_ERR%
echo ---------- log: %TEMP%\ion-verify-full.txt ----------
type "%TEMP%\ion-verify-full.txt"
if not defined _ION_VNP pause
exit /b %VERIFY_ERR%
