@echo off
REM ION DEX Skill autopilot CLI wrapper (UTF-8)
setlocal
cd /d "%~dp0.."
node scripts/skill-route.mjs %*
exit /b %ERRORLEVEL%
