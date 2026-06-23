# SAM makefile equivalent for Windows (invoked via backend/make.cmd).
$ErrorActionPreference = "Stop"
$backendRoot = Split-Path $PSScriptRoot -Parent

if (-not $env:ARTIFACTS_DIR) {
  Write-Error "ARTIFACTS_DIR is not set (expected when invoked by SAM build)"
}

Push-Location $backendRoot
try {
  npm ci
  if (-not $?) { exit 1 }

  npm run build
  if (-not $?) { exit 1 }

  node scripts/sam-prepare-artifacts.mjs
  if (-not $?) { exit 1 }

  Push-Location $env:ARTIFACTS_DIR
  try {
    npm ci --omit=dev
    if (-not $?) { exit 1 }
  } finally {
    Pop-Location
  }
} finally {
  Pop-Location
}

exit 0
