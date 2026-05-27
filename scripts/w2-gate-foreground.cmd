@echo off
setlocal EnableExtensions
cd /d "%~dp0.."
title ION W2 work order (foreground)
echo.
echo  W2 gate entry (visible in this terminal):
echo    1) verify-100 until GREEN  - scripts\verify-100-until-green-foreground.cmd
echo    2) live progress only      - scripts\verify-100-follow-progress.cmd
echo.
echo  Do NOT use scripts\verify-100-until-green.cmd for daily work (redirects to bg log).
echo.
call "%~dp0verify-100-until-green-foreground.cmd"
exit /b %ERRORLEVEL%
