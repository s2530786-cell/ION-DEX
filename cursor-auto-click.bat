@echo off
chcp 437 >nul
title Cursor Auto Click
mode con: cols=55 lines=20

:MENU
cls
echo ==========================================
echo   Cursor Auto Confirm Tool
echo   Let Cursor work 24/7 - auto dismiss popups
echo ==========================================
echo.
echo [1] GREEN  START auto confirm
echo       (Ctrl+Enter every 5s)
echo.
echo [2] RED    STOP auto confirm
echo       (back to manual mode)
echo.
echo [3] STATUS check
echo.
echo [Q] Quit
echo.
set /p choice="Choice (1/2/3/Q): "

if "%choice%"=="1" goto START
if "%choice%"=="2" goto STOP
if "%choice%"=="3" goto STATUS
if /i "%choice%"=="Q" exit /b
goto MENU

:START
cls
echo GREEN  Starting auto confirm...
echo.

:: Kill old instances
taskkill /F /FI "WINDOWTITLE eq CursorAutoClick*" /IM wscript.exe 2>nul >nul
taskkill /F /FI "WINDOWTITLE eq CursorAutoClick*" /IM cscript.exe 2>nul >nul

set VBS=%TEMP%\cursor-click-loop.vbs
(
echo Set WshShell = CreateObject("WScript.Shell"^)
echo WshShell.AppActivate "Cursor"
echo WScript.Sleep 500
echo Do While True
echo   On Error Resume Next
echo   WshShell.SendKeys "^~"
echo   WScript.Sleep 1000
echo   WshShell.SendKeys "~"
echo   WScript.Sleep 4000
echo Loop
) > "%VBS%"

start "CursorAutoClick" wscript.exe "%VBS%"
echo GREEN  Auto confirm is ON
echo        Ctrl+Enter every 5s
echo.
pause
goto MENU

:STOP
cls
echo RED  Stopping auto confirm...
taskkill /F /FI "WINDOWTITLE eq CursorAutoClick*" /IM wscript.exe 2>nul >nul
del "%TEMP%\cursor-click-loop.vbs" 2>nul >nul
echo RED  Stopped
echo.
pause
goto MENU

:STATUS
cls
tasklist /FI "WINDOWTITLE eq CursorAutoClick*" 2>nul | find "wscript" >nul
if %errorlevel%==0 (
    echo GREEN  Auto confirm is RUNNING
) else (
    echo RED  Auto confirm is STOPPED
)
echo.
pause
goto MENU
