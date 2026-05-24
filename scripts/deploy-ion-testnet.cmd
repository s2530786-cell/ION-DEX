@echo off
setlocal EnableExtensions
cd /d "%~dp0.."

echo === ION DEX testnet deploy orchestrator (preflight only) ===
echo Repo: %CD%
echo.

if "%ION_DEPLOY_NETWORK%"=="" set ION_DEPLOY_NETWORK=testnet
if "%ION_DEPLOY_ALLOW_LIVE%"=="" set ION_DEPLOY_ALLOW_LIVE=1

echo [1/4] FunC compile verification...
node scripts\compile-func.mjs
if errorlevel 1 goto :fail

echo [2/4] Contract file presence...
node scripts\verify-contracts.mjs
if errorlevel 1 goto :fail

echo [3/4] Live deploy preflight (requires ION_DEPLOY_* env)...
if "%ION_DEPLOY_OWNER_ADDRESS%"=="" (
  echo SKIP preflight - set ION_DEPLOY_OWNER_ADDRESS and other required env vars.
  echo See docs\26-ion-testnet-deploy-checklist.md
  goto :done
)

node scripts\deploy-fift-live.mjs
if errorlevel 1 goto :fail

echo [4/4] Optional plan BoC (requires fift + FeeDistributor.fif)...
if "%ION_DEPLOY_BROADCAST%"=="1" (
  set ION_DEPLOY_SEND_MODE=plan
  node scripts\deploy-fift-live-send.mjs
  if errorlevel 1 goto :fail
) else (
  echo SKIP plan - set ION_DEPLOY_BROADCAST=1 and ION_DEPLOY_CONFIRM to generate BoC.
)

:done
echo.
echo OK - testnet preflight complete. Next: docs\26-ion-testnet-deploy-checklist.md
exit /b 0

:fail
echo ERROR - testnet deploy preflight failed
exit /b 1
