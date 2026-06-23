@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "ION_VERIFY_NONINTERACTIVE=1"
REM Background-only launcher (output hidden). For visible work use:
REM   scripts\verify-100-until-green-foreground.cmd
REM   scripts\verify-100-follow-progress.cmd
set "RUNNER_LOG=%TEMP%\ion-verify-100-until-green-bg.log"
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
echo [%date% %time%] verify-100-until-green BACKGROUND starting >> "%RUNNER_LOG%"
echo [%date% %time%] Prefer foreground: scripts\verify-100-until-green-foreground.cmd >> "%RUNNER_LOG%"
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-100-until-green.ps1" >> "%RUNNER_LOG%" 2>&1
set "EC=%ERRORLEVEL%"
echo [%date% %time%] verify-100-until-green exit %EC% >> "%RUNNER_LOG%"
exit /b %EC%
