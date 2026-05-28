@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
node ".cursor\hooks\ion-skill-route-subagent.mjs" %*
exit /b %ERRORLEVEL%
