@echo off
setlocal EnableExtensions
rem ION GitHub daily pipeline — discovery + DEX enrich + Top 5 skill stubs.

rem Register: scripts\register-github-daily-task.ps1

rem Optional clone: set ION_GITHUB_DAILY_CLONE=1 before run

setlocal EnableExtensions



cd /d "%~dp0.."



if not defined ION_PRIVATE_CORE_ROOT (

  if exist "d:\openclaw-tools\ion-private-core" (

    set "ION_PRIVATE_CORE_ROOT=d:\openclaw-tools\ion-private-core"

  )

)



echo [ION] GitHub daily pipeline %date% %time%

if defined ION_PRIVATE_CORE_ROOT echo Private core: %ION_PRIVATE_CORE_ROOT%



node scripts\github-daily-pipeline.mjs

set "RC=%ERRORLEVEL%"



if not "%RC%"=="0" (

  echo.

  echo Pipeline failed with exit code %RC%.

  exit /b %RC%

)

