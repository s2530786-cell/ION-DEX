@echo off
setlocal
cd /d "%~dp0.."
set ION_VERIFY_NONINTERACTIVE=1
set ION_AGENT_AUTONOMOUS=1
node scripts\autonomous-work-watchdog.mjs --daemon --interval 60
