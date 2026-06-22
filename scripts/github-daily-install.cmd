@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
if "%~1"=="" (
  node scripts\github-daily-install.mjs --list
  exit /b 0
)
node scripts\github-daily-install.mjs %*
exit /b %ERRORLEVEL%
