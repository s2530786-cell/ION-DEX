@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
set "ION_VERIFY_NONINTERACTIVE=1"
call "%~dp0verify-full.cmd"
exit /b %ERRORLEVEL%
