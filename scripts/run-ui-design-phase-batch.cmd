@echo off
setlocal
cd /d "%~dp0.."
set ION_VERIFY_NONINTERACTIVE=1
set ION_AGENT_AUTONOMOUS=1
node scripts\ui-design-phase-pipeline.mjs %*
exit /b %ERRORLEVEL%
