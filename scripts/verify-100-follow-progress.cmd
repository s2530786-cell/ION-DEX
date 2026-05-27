@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title ION verify-100 progress (live)
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
echo.
echo  Live progress for verify-100. Output stays in THIS window.
echo  Full gate (if not running yet): scripts\verify-100-until-green-foreground.cmd
echo.
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-100-follow-progress.ps1" %*
exit /b %ERRORLEVEL%
