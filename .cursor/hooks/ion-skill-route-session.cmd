@echo off
setlocal EnableExtensions
cd /d "%~dp0..\.."
node ".cursor\hooks\ion-skill-route-session.mjs" %*
exit /b %ERRORLEVEL%
