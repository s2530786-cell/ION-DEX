@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
node ".cursor\hooks\ion-skill-route-task-pretool.mjs" %*
exit /b %ERRORLEVEL%
