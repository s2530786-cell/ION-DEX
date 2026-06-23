@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
if not exist "scripts\verify-full.cmd" exit /b 0
set "ION_VERIFY_NONINTERACTIVE=1"
call scripts\verify-full.cmd
exit /b %ERRORLEVEL%
