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

# Folders to skip (build artifacts, vendored deps, reference clones)
$excludeDirs = @(
  "node_modules", "dist", "build", ".next", ".turbo",
  "out", "coverage", ".vite", ".cache", ".tmp",
  "target", "artifacts", "cache",
  "__pycache__", ".venv", "venv",
  # Local official ION reference clone; ignored by git and not maintained by this repo.
  "ion",
  ".git",
  # Cursor agent/runtime scratch (may be locked while a session is active).
  ".cursor",
  # Large reference / prototype trees outside ION DEX deliverables (encoding scan only).
  "doubao-dex-source",
  "doubao-vue-prototype",
  "gmx-contracts",
  "hermes-agent",
  "ion-dex-ai-subscription-release-v1.0.0-final",
  "reference",
  "output",
  "ui-designs",
  "research",
  ".verify-100-gate",
  "playwright-report",
  "test-results",
  ".playwright",
  "cursor-queue-result"
)

function Test-IsExcluded {
  param([string]$FullPath)
  foreach ($d in $excludeDirs) {
    if ($FullPath -match [Regex]::Escape([IO.Path]::DirectorySeparatorChar + $d + [IO.Path]::DirectorySeparatorChar)) {
      return $true
    }
    if ($FullPath -match [Regex]::Escape([IO.Path]::AltDirectorySeparatorChar + $d + [IO.Path]::AltDirectorySeparatorChar)) {
      return $true
    }
  }
  return $false
}

$includeExtSet = @{
  ".ts" = $true; ".tsx" = $true; ".js" = $true; ".jsx" = $true; ".mjs" = $true; ".cjs" = $true
  ".json" = $true; ".jsonc" = $true; ".yml" = $true; ".yaml" = $true; ".toml" = $true
  ".md" = $true; ".txt" = $true; ".html" = $true; ".css" = $true; ".scss" = $true
  ".sol" = $true; ".fc" = $true; ".tact" = $true; ".func" = $true
  ".py" = $true; ".go" = $true; ".rs" = $true
  ".sh" = $true; ".ps1" = $true
  ".env" = $true
}

function Test-ShouldScanFile {
  param([string]$FilePath)
  $name = [IO.Path]::GetFileName($FilePath)
  if ($name -like ".env*") {
    return $true
  }
  $ext = [IO.Path]::GetExtension($FilePath).ToLower()
  return $includeExtSet.ContainsKey($ext)
}

function Get-ScanFiles {
  param([string]$Dir)
  $list = New-Object System.Collections.Generic.List[System.IO.FileInfo]
  $stack = New-Object System.Collections.Stack
  $stack.Push($Dir)
  while ($stack.Count -gt 0) {
    $current = [string]$stack.Pop()
    try {
      foreach ($entry in [IO.Directory]::EnumerateFileSystemEntries($current)) {
        if ([IO.Directory]::Exists($entry)) {
          $dirName = [IO.Path]::GetFileName($entry)
          if ($excludeDirs -contains $dirName) {
            continue
          }
          if (Test-IsExcluded $entry) {
            continue
          }
          if (Test-Path (Join-Path $entry ".git")) {
            continue
          }
          $stack.Push($entry)
          continue
        }
        if (-not (Test-ShouldScanFile $entry)) {
          continue
        }
        if (Test-IsExcluded $entry) {
          continue
        }
        $list.Add([IO.FileInfo]$entry) | Out-Null
      }
    } catch {
      # Skip locked or inaccessible paths during verify-only scans.
    }
  }
  return $list
}

function Read-FileBytesShared {
  # Read bytes with FileShare.ReadWrite so a file briefly held open by another
  # process (e.g. the verify-100 driver updating SESSION_STATE.md between passes)
  # does not abort the whole encoding gate. Retries transient IO locks.
  param([string]$FullName)
  $attempts = 0
  while ($true) {
    $attempts++
    try {
      $fs = [IO.File]::Open($FullName, [IO.FileMode]::Open, [IO.FileAccess]::Read, [IO.FileShare]::ReadWrite)
      try {
        $len = [int]$fs.Length
        $buffer = New-Object byte[] $len
        $offset = 0
        while ($offset -lt $len) {
          $read = $fs.Read($buffer, $offset, $len - $offset)
          if ($read -le 0) { break }
          $offset += $read
        }
        return $buffer
      } finally {
        $fs.Dispose()
      }
    } catch [System.IO.IOException] {
      if ($attempts -ge 5) { throw }
      Start-Sleep -Milliseconds (100 * $attempts)
    }
  }
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

$files = Get-ScanFiles -Dir $root.Path

foreach ($f in $files) {
  $scanned++
  $bytes = Read-FileBytesShared -FullName $f.FullName
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
