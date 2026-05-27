# Create junction C:\Users\...\Docker\wsl -> D:\Docker\wsl when data was moved but link missing
# UTF-8 without BOM
$ErrorActionPreference = "Stop"
$Source = Join-Path $env:LOCALAPPDATA "Docker\wsl"
$Target = "D:\Docker\wsl"

if (-not (Test-Path $Target)) {
    Write-Error "Missing target: $Target — run full migrate-docker-wsl-junction-to-d.ps1"
}
if (Test-Path $Source) {
    $item = Get-Item $Source -Force
    if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
        Write-Host "Junction already OK: $Source -> $($item.Target)"
        exit 0
    }
    Write-Error "Path exists and is not a junction: $Source"
}

$parent = Split-Path $Source
if (-not (Test-Path $parent)) { New-Item -ItemType Directory -Force -Path $parent | Out-Null }

$cmd = Join-Path $env:SystemRoot "System32\cmd.exe"
& $cmd /c mklink /J "`"$Source`"" "`"$Target`""
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Created: $Source -> $Target"
exit 0
