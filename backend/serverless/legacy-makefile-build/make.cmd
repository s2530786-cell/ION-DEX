@echo off
setlocal
if /I "%~1"=="build-IonDexApiGatewayFunction" (
  powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0scripts\sam-build-artifacts.ps1"
  exit /b %ERRORLEVEL%
)
echo Unknown make target: %~1
exit /b 1
