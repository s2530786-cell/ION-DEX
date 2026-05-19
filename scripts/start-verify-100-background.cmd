@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

set STAMP=%date:~0,4%%date:~5,2%%date:~8,2%-%time:~0,2%%time:~3,2%%time:~6,2%
set STAMP=%STAMP: =0%
set LOG=%TEMP%\ion-verify-100-bg-%STAMP%.log
set POINTER=%TEMP%\ion-verify-100-bg-latest.txt

echo LOG=%LOG%> "%POINTER%"
echo START=%date% %time%>>"%POINTER%"

start "ION verify-100" /MIN powershell -NoProfile -ExecutionPolicy Bypass -Command ^
  "& { Set-Location '%CD%'; & '.\scripts\verify-100.ps1' *>> '%LOG%'; $e=$LASTEXITCODE; Add-Content '%POINTER%' \"EXIT=$e\"; exit $e }"

echo Started verify-100 (minimized PowerShell).
echo Log: %LOG%
echo Pointer: %POINTER%
