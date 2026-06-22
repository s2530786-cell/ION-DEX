# Move Docker WSL data off C: via directory junction (Docker still uses %LOCALAPPDATA%\Docker\wsl path, data on D:)
# UTF-8 without BOM
# Requires: Admin PowerShell, Docker Desktop fully quit
param(
    [string]$TargetRoot = "D:\Docker\wsl",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$Source = Join-Path $env:LOCALAPPDATA "Docker\wsl"

function Test-Admin {
    $id = [Security.Principal.WindowsIdentity]::GetCurrent()
    $p = New-Object Security.Principal.WindowsPrincipal($id)
    $p.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Stop-DockerDesktop {
    Write-Host "Stopping Docker Desktop..."
    Get-Process -Name "Docker Desktop", "com.docker.backend", "com.docker.build" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 3
    wsl --shutdown 2>$null | Out-Null
    Start-Sleep -Seconds 2
}

if (-not (Test-Admin)) {
    Write-Error "Run as Administrator. Example: Start-Process powershell -Verb RunAs -ArgumentList '-NoProfile -ExecutionPolicy Bypass -File \"$PSCommandPath\"'"
}

if (-not (Test-Path $Source)) {
    Write-Error "Docker wsl folder not found: $Source"
}

$vhdx = Get-ChildItem $Source -Recurse -Filter "docker_data.vhdx" -ErrorAction SilentlyContinue | Select-Object -First 1
if ($vhdx -and $vhdx.FullName -like "D:*") {
    Write-Host "Docker WSL data already on D: ($($vhdx.FullName))"
    exit 0
}

$existingTarget = Resolve-Path $TargetRoot -ErrorAction SilentlyContinue
if ($existingTarget -and (Test-Path (Join-Path $TargetRoot "disk\docker_data.vhdx"))) {
    Write-Host "Target already has docker_data.vhdx — creating junction only..."
    if (Test-Path $Source) {
        if ((Get-Item $Source).Attributes -band [IO.FileAttributes]::ReparsePoint) {
            Write-Host "Junction already exists: $Source"
            exit 0
        }
        if (-not $Force) { Write-Error "Source exists and is not a junction. Use -Force after backup." }
        Remove-Item $Source -Recurse -Force
    }
    $cmd = Join-Path $env:SystemRoot "System32\cmd.exe"
    & $cmd /c mklink /J "`"$Source`"" "`"$TargetRoot`""
    Write-Host "Junction created: $Source -> $TargetRoot"
    exit 0
}

Write-Host "Source:  $Source"
Write-Host "Target:  $TargetRoot"
if ($vhdx) { Write-Host "VHDX:    $($vhdx.FullName) ($([math]::Round($vhdx.Length/1GB,2)) GB)" }

if (-not $Force) {
    Write-Host "`nThis will QUIT Docker, MOVE wsl data to D:, and create a junction on C:."
    Write-Host "Re-run with -Force to proceed.`n"
    exit 2
}

Stop-DockerDesktop

New-Item -ItemType Directory -Force -Path (Split-Path $TargetRoot) | Out-Null
if (Test-Path $TargetRoot) {
    Write-Warning "Target not empty: $TargetRoot — merging may be unsafe; aborting."
    exit 3
}

Write-Host "Moving wsl folder to D: (may take several minutes)..."
Move-Item -Path $Source -Destination $TargetRoot

Write-Host "Creating junction..."
$cmd = Join-Path $env:SystemRoot "System32\cmd.exe"
& $cmd /c mklink /J "`"$Source`"" "`"$TargetRoot`""
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nDone. Start Docker Desktop manually."
Write-Host "Verify: docker_data.vhdx should be under $TargetRoot"
