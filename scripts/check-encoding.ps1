# ION DEX - Encoding Verifier (PowerShell)
# Enforces: UTF-8 without BOM, no NUL bytes, no UTF-16 LE/BE.
# Usage:
#   pwsh -File scripts/check-encoding.ps1                    # verify only
#   pwsh -File scripts/check-encoding.ps1 -Fix               # auto re-encode any violations
#   pwsh -File scripts/check-encoding.ps1 -Path frontend\src # restrict scan path
# Exit code 0 = clean, 1 = violations found.

param(
  [string]$Path = ".",
  [switch]$Fix
)

$ErrorActionPreference = "Stop"

# File globs we care about (source code + config + docs)
$includeExt = @(
  "*.ts", "*.tsx", "*.js", "*.jsx", "*.mjs", "*.cjs",
  "*.json", "*.jsonc", "*.yml", "*.yaml", "*.toml",
  "*.md", "*.txt", "*.html", "*.css", "*.scss",
  "*.sol", "*.fc", "*.tact", "*.func",
  "*.py", "*.go", "*.rs",
  "*.sh", "*.ps1",
  "*.env", "*.env.*"
)

# Folders to skip (build artifacts and vendored deps)
$excludeDirs = @(
  "node_modules", "dist", "build", ".next", ".turbo",
  "out", "coverage", ".vite", ".cache",
  "target", "artifacts", "cache",
  "__pycache__", ".venv", "venv",
  ".git"
)

function Test-IsExcluded {
  param([string]$FullPath)
  foreach ($d in $excludeDirs) {
    if ($FullPath -match [Regex]::Escape([IO.Path]::DirectorySeparatorChar + $d + [IO.Path]::DirectorySeparatorChar)) {
      return $true
    }
  }
  return $false
}

$root = Resolve-Path $Path
Write-Host ""
Write-Host "===== ION DEX Encoding Check =====" -ForegroundColor Cyan
Write-Host "Root: $root"
Write-Host "Mode: $(if ($Fix) { 'FIX' } else { 'VERIFY-ONLY' })"
Write-Host ""

$violations = @()
$fixed = @()
$scanned = 0

$files = Get-ChildItem -Path $root -Recurse -File -Include $includeExt -ErrorAction SilentlyContinue |
         Where-Object { -not (Test-IsExcluded $_.FullName) }

foreach ($f in $files) {
  $scanned++
  $bytes = [IO.File]::ReadAllBytes($f.FullName)
  if ($bytes.Length -eq 0) { continue }

  $issues = @()

  # 1. UTF-16 LE BOM
  if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
    $issues += "UTF-16 LE BOM"
  }
  # 2. UTF-16 BE BOM
  elseif ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
    $issues += "UTF-16 BE BOM"
  }
  # 3. UTF-8 BOM (we want NO BOM)
  elseif ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
    $issues += "UTF-8 BOM (must be no-BOM)"
  }

  # 4. NUL byte anywhere = corrupted (UTF-16 misread as UTF-8 leaves NULs)
  if ($bytes -contains 0) {
    $issues += "Contains NUL bytes"
  }

  if ($issues.Count -gt 0) {
    $rel = $f.FullName.Substring($root.Path.Length).TrimStart('\','/')
    $violations += [PSCustomObject]@{
      File   = $rel
      Issues = ($issues -join ", ")
    }

    if ($Fix) {
      # Decide source encoding heuristically
      $decoded = $null
      if ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFF -and $bytes[1] -eq 0xFE) {
        $decoded = [Text.Encoding]::Unicode.GetString($bytes, 2, $bytes.Length - 2)
      }
      elseif ($bytes.Length -ge 2 -and $bytes[0] -eq 0xFE -and $bytes[1] -eq 0xFF) {
        $decoded = [Text.Encoding]::BigEndianUnicode.GetString($bytes, 2, $bytes.Length - 2)
      }
      elseif ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
        $decoded = [Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
      }
      else {
        # No BOM but has NULs: assume UTF-16 LE without BOM (the actual Windows PS corruption pattern)
        $decoded = [Text.Encoding]::Unicode.GetString($bytes)
        $decoded = $decoded -replace "`0", ""
      }

      # Normalize line endings to LF
      $decoded = $decoded -replace "`r`n", "`n" -replace "`r", "`n"

      $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
      [IO.File]::WriteAllText($f.FullName, $decoded, $utf8NoBom)
      $fixed += $rel
    }
  }
}

Write-Host "Scanned: $scanned files" -ForegroundColor Gray
Write-Host ""

if ($violations.Count -eq 0) {
  Write-Host "OK - All files are UTF-8 without BOM, no NUL bytes." -ForegroundColor Green
  exit 0
}

Write-Host "VIOLATIONS:" -ForegroundColor Red
$violations | Format-Table -AutoSize | Out-String | Write-Host

if ($Fix) {
  Write-Host ""
  Write-Host "FIXED $($fixed.Count) files:" -ForegroundColor Yellow
  $fixed | ForEach-Object { Write-Host "  $_" }
  Write-Host ""
  Write-Host "Re-running verification..." -ForegroundColor Cyan
  & $PSCommandPath -Path $Path
  exit $LASTEXITCODE
}

Write-Host "Run with -Fix to auto-correct." -ForegroundColor Yellow
exit 1
