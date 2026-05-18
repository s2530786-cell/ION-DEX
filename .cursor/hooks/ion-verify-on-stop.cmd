@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
if not exist "scripts\agent-verify.cmd" exit /b 0
call scripts\agent-verify.cmd
exit /b %ERRORLEVEL%
