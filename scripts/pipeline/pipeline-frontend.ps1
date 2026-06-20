# ION DEX Frontend Pipeline
# Purpose: Automate frontend build, visual diff, and page verification
# Usage: .\pipeline-frontend.ps1 [-Mode full|build|diff|verify]

param([string]$Mode = "full")

$ErrorActionPreference = "Continue"
$ProjectRoot = "D:\openclaw-tools\ion-dex-nuke"
$Pages = @("index", "swap", "pool", "stake", "bridge")

function Step-Build {
    Write-Host "[PIPELINE] Step 1: Build"
    Push-Location $ProjectRoot
    $result = npx next build 2>&1
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[FAIL] Build failed"
        return $false
    }
    Write-Host "[OK] Build passed"
    return $true
}

function Step-DevServer {
    Write-Host "[PIPELINE] Step 2: Start Dev Server"
    $existing = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -match "next dev" }
    if ($existing) {
        Write-Host "[OK] Dev server already running"
        return $true
    }
    Start-Process -FilePath "npx" -ArgumentList "next dev" -WorkingDirectory $ProjectRoot -WindowStyle Hidden
    Start-Sleep -Seconds 5
    Write-Host "[OK] Dev server started"
    return $true
}

function Step-VerifyPages {
    Write-Host "[PIPELINE] Step 3: Verify Pages"
    foreach ($page in $Pages) {
        try {
            $url = "http://localhost:3000/$page"
            if ($page -eq "index") { $url = "http://localhost:3000/" }
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 10 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                Write-Host "  [OK] $page -> 200"
            } else {
                Write-Host "  [FAIL] $page -> $($response.StatusCode)"
                return $false
            }
        } catch {
            Write-Host "  [FAIL] $page -> $_"
            return $false
        }
    }
    Write-Host "[OK] All pages HTTP 200"
    return $true
}

function Step-VisualDiff {
    Write-Host "[PIPELINE] Step 4: Visual Diff"
    Push-Location $ProjectRoot
    $result = node scripts/visual-diff.mjs 2>&1
    Pop-Location
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARN] Visual diff found differences"
        Write-Host $result
        return $true  # Non-blocking
    }
    Write-Host "[OK] Visual diff passed"
    return $true
}

# Main
$success = $true

switch ($Mode) {
    "full" {
        if (Step-Build) { $success = $true } else { $success = $false }
        if ($success) { if (Step-DevServer) { $success = $true } else { $success = $false } }
        if ($success) { if (Step-VerifyPages) { $success = $true } else { $success = $false } }
        if ($success) { if (Step-VisualDiff) { $success = $true } else { $success = $false } }
    }
    "build" { $success = Step-Build }
    "diff" { $success = Step-VisualDiff }
    "verify" { $success = Step-VerifyPages }
}

if ($success) {
    Write-Host "[PIPELINE] PASSED"
    exit 0
} else {
    Write-Host "[PIPELINE] FAILED"
    exit 1
}
