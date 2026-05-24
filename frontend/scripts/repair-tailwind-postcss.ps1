# One-shot fix for "Cannot find module tailwindcss\dist\lib.js"
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot\..

Write-Host "==> Removing broken tailwindcss package..."
Remove-Item -Recurse -Force "node_modules\tailwindcss" -ErrorAction SilentlyContinue

Write-Host "==> Removing stale PostCSS config variants..."
Remove-Item -Force "postcss.config.cjs" -ErrorAction SilentlyContinue
Remove-Item -Force "postcss.config.mjs" -ErrorAction SilentlyContinue

Write-Host "==> Reinstalling tailwindcss@3.4.19..."
npm install tailwindcss@3.4.19 --save-dev --no-fund --no-audit --legacy-peer-deps

node scripts/ensure-tailwind-v3.mjs

$ver = (Get-Content "node_modules\tailwindcss\package.json" | ConvertFrom-Json).version
Write-Host "tailwindcss version: $ver"
if (-not (Test-Path "node_modules\tailwindcss\lib\index.js")) {
  throw "lib/index.js missing — run: Remove-Item -Recurse -Force node_modules; npm install --legacy-peer-deps"
}
if (Test-Path "node_modules\tailwindcss\dist\lib.js") {
  throw "Still on Tailwind v4 layout — delete node_modules and reinstall"
}
Write-Host "OK — run: npm run dev:local"
