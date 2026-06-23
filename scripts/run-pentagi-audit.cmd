@echo off
setlocal EnableExtensions
rem ION DEX Pentagi audit runner. UTF-8 without BOM.

cd /d "%~dp0.."

set "COMPOSE_FILE=docker/security-sandbox/docker-compose.yml"
set "PENTAGI_PROFILE=pentagi"

if not defined PENTAGI_LISTEN_IP set "PENTAGI_LISTEN_IP=127.0.0.1"
if not defined PENTAGI_LISTEN_PORT set "PENTAGI_LISTEN_PORT=18443"
if not defined PENTAGI_PGVECTOR_LISTEN_IP set "PENTAGI_PGVECTOR_LISTEN_IP=127.0.0.1"
if not defined PENTAGI_PGVECTOR_LISTEN_PORT set "PENTAGI_PGVECTOR_LISTEN_PORT=15432"
if not defined PENTAGI_SCRAPER_LISTEN_IP set "PENTAGI_SCRAPER_LISTEN_IP=127.0.0.1"
if not defined PENTAGI_SCRAPER_LISTEN_PORT set "PENTAGI_SCRAPER_LISTEN_PORT=19443"

if "%PENTAGI_AUDIT_PULL%"=="1" (
  docker compose -f "%COMPOSE_FILE%" --profile %PENTAGI_PROFILE% pull pentagi pentagi-agent pentagi-pgvector pentagi-scraper
  if errorlevel 1 exit /b %ERRORLEVEL%
)

echo [ION] Starting Pentagi audit sandbox %date% %time%
echo Compose: %COMPOSE_FILE%
echo URL: https://%PENTAGI_LISTEN_IP%:%PENTAGI_LISTEN_PORT%

docker compose -f "%COMPOSE_FILE%" --profile %PENTAGI_PROFILE% up -d pentagi-pgvector pentagi-scraper pentagi-agent pentagi
set "RC=%ERRORLEVEL%"

if not "%RC%"=="0" (
  echo.
  echo Pentagi audit sandbox failed with exit code %RC%.
  exit /b %RC%
)

echo.
echo Pentagi audit sandbox started.
echo Open: https://%PENTAGI_LISTEN_IP%:%PENTAGI_LISTEN_PORT%
echo Stop: docker compose -f %COMPOSE_FILE% --profile %PENTAGI_PROFILE% down
exit /b 0
