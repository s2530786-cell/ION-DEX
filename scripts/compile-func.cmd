@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0.."
node scripts\compile-func.mjs
exit /b %ERRORLEVEL%
