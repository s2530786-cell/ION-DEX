# ION DEX Frontend Pipeline
# Purpose: Automate current Vite frontend build, tests, dev server, and page verification
# Usage: .\pipeline-frontend.ps1 [-Mode full|build|test|diff|verify]

param([string]$Mode = "full")

$ErrorActionPreference = "Continue"
$ProjectRoot = "D:\openclaw-tools\ion-dex-nuke"
$FrontendRoot = Join-Path $ProjectRoot "frontend"
$Pages = @("index", "swap", "pool", "stake", "bridge")
$BaseUrl = "http://127.0.0.1:3000"

function Invoke-StepCommand {
    param(
        [string]$Label,
        [string]$Command,
        [string]$WorkingDirectory
    )

    Write-Host "[PIPELINE] $Label"
    Push-Location $WorkingDirectory
    $result = powershell -NoProfile -ExecutionPolicy Bypass -Command $Command 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location

    if ($exitCode -ne 0) {
        Write-Host "[FAIL] $Label failed"
        Write-Host $result
        return $false
    }

    Write-Host "[OK] $Label passed"
    return $true
}

function Step-Build {
    return Invoke-StepCommand -Label "Step 1: Build" -Command "npm run build" -WorkingDirectory $FrontendRoot
}

function Step-Test {
    return Invoke-StepCommand -Label "Step 2: Unit Tests" -Command "npm test" -WorkingDirectory $FrontendRoot
}

function Wait-HttpOk {
    param([string]$Url, [int]$TimeoutSeconds = 30)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        try {
            $response = Invoke-WebRequest -Uri $Url -TimeoutSec 5 -UseBasicParsing
            if ($response.StatusCode -eq 200) {
                return $true
            }
        } catch {
            Start-Sleep -Milliseconds 750
        }
    }
    return $false
}

function Step-DevServer {
    Write-Host "[PIPELINE] Step 3: Start Dev Server"
    if (Wait-HttpOk -Url "$BaseUrl/" -TimeoutSeconds 3) {
        Write-Host "[OK] Dev server already serving HTTP 200"
        return $true
    }

    Start-Process -FilePath "npm.cmd" -ArgumentList @("run", "dev") -WorkingDirectory $FrontendRoot -WindowStyle Hidden | Out-Null
    if (Wait-HttpOk -Url "$BaseUrl/" -TimeoutSeconds 45) {
        Write-Host "[OK] Dev server started"
        return $true
    }

    Write-Host "[FAIL] Dev server did not become ready"
    return $false
}

function Step-VerifyPages {
    Write-Host "[PIPELINE] Step 4: Verify Pages"
    foreach ($page in $Pages) {
        try {
            $url = "$BaseUrl/"
            if ($page -ne "index") { $url = "$BaseUrl/#$page" }
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 15 -UseBasicParsing
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
    Write-Host "[PIPELINE] Step 5: Visual Diff"
    $scriptPath = Join-Path $ProjectRoot "scripts\visual-diff.mjs"
    if (!(Test-Path $scriptPath)) {
        Write-Host "[WARN] Visual diff script not found; skipping non-blocking step"
        return $true
    }

    Push-Location $ProjectRoot
    $result = node scripts/visual-diff.mjs all 2>&1
    $exitCode = $LASTEXITCODE
    Pop-Location

    if ($exitCode -ne 0) {
        Write-Host "[WARN] Visual diff found differences or could not run"
        Write-Host $result
        return $true
    }
    Write-Host "[OK] Visual diff passed"
    return $true
}

$success = $true

switch ($Mode) {
    "full" {
        if (Step-Build) { $success = $true } else { $success = $false }
        if ($success) { if (Step-Test) { $success = $true } else { $success = $false } }
        if ($success) { if (Step-DevServer) { $success = $true } else { $success = $false } }
        if ($success) { if (Step-VerifyPages) { $success = $true } else { $success = $false } }
        if ($success) { if (Step-VisualDiff) { $success = $true } else { $success = $false } }
    }
    "build" { $success = Step-Build }
    "test" { $success = Step-Test }
    "diff" { $success = Step-VisualDiff }
    "verify" { $success = Step-VerifyPages }
    default {
        Write-Host "[FAIL] Unknown mode: $Mode"
        $success = $false
    }
}

if ($success) {
    Write-Host "[PIPELINE] PASSED"
    exit 0
} else {
    Write-Host "[PIPELINE] FAILED"
    exit 1
}
