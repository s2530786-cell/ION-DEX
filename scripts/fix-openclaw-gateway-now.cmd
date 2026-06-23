@echo off
REM Run as Administrator: fixes NSSM + restarts OpenClawGW (port 18789).
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fix-openclaw-gateway-now.ps1"
pause
