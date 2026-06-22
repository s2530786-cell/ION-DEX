@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "PS_EXE=%SystemRoot%\System32\WindowsPowerShell\v1.0\powershell.exe"
set "LOG=%TEMP%\ion-verify-100-watch-ship-bg.log"
echo [%date% %time%] watch-and-ship starting >> "%LOG%"
"%PS_EXE%" -NoProfile -ExecutionPolicy Bypass -File "%~dp0verify-100-watch-and-ship.ps1" >> "%LOG%" 2>&1
exit /b %ERRORLEVEL%
