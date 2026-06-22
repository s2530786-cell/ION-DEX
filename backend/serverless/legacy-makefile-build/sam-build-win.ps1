# Windows-friendly SAM build: use container when `make` is missing.
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

npm run build
if (-not $?) { exit 1 }

$template = "serverless/template.yaml"
$makeCmd = Get-Command make -ErrorAction SilentlyContinue

if ($makeCmd) {
  Write-Host "Using local make: $($makeCmd.Source)"
  sam build -t $template @args
} else {
  Write-Host "make not found in PATH; running sam build --use-container (requires Docker)."
  sam build -t $template --use-container @args
}

exit $LASTEXITCODE
