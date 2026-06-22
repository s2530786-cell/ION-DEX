# Background: migrate Docker wsl to D: (if needed), then setup-compose-for-agents -PullModels -BuildAll
# UTF-8 without BOM
param(
    [switch]$SkipMigration,
    [switch]$SkipDriveCheck
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$DataRoot = "D:\Docker\ion-dex"
$LogDir = Join-Path $DataRoot "logs"
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
$stamp = Get-Date -Format "yyyyMMdd-HHmmss"
$log = Join-Path $LogDir "pull-build-$stamp.log"

function Write-Log($msg) {
    $line = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $msg"
    Add-Content -Path $log -Value $line -Encoding UTF8
    Write-Host $line
}

Write-Log "Log file: $log"

$wsl = Join-Path $env:LOCALAPPDATA "Docker\wsl"
$vhdx = Get-ChildItem $wsl -Recurse -Filter "docker_data.vhdx" -ErrorAction SilentlyContinue | Select-Object -First 1
$onD = $vhdx -and $vhdx.FullName -like "D:*"

if (-not $onD -and -not $SkipMigration) {
    Write-Log "Docker data still on C: ($($vhdx.FullName)). Launching elevated migration..."
    $migrate = Join-Path $RepoRoot "scripts\migrate-docker-wsl-junction-to-d.ps1"
    $proc = Start-Process -FilePath "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" `
        -Verb RunAs `
        -ArgumentList @(
            "-NoProfile", "-ExecutionPolicy", "Bypass",
            "-File", "`"$migrate`"", "-Force"
        ) -PassThru -Wait
    if ($proc.ExitCode -ne 0) {
        Write-Log "Migration elevated step exit $($proc.ExitCode). Trying junction-only fix..."
        $fix = Join-Path $RepoRoot "scripts\fix-docker-wsl-junction-only.ps1"
        if ((Test-Path "D:\Docker\wsl\disk\docker_data.vhdx") -and (Test-Path $fix)) {
            & "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File $fix 2>&1 | ForEach-Object { Write-Log $_ }
        }
        if (-not (Test-Path (Join-Path $env:LOCALAPPDATA "Docker\wsl"))) {
            Write-Log "Junction still missing — run fix-docker-wsl-junction-only.ps1 as admin, start Docker, re-run."
            exit 1
        }
    }
    Write-Log "Migration finished. Please start Docker Desktop manually if it is not running."
    Start-Sleep -Seconds 5
}

$setupArgs = @(
    "-NoProfile", "-ExecutionPolicy", "Bypass",
    "-File", (Join-Path $RepoRoot "scripts\setup-compose-for-agents.ps1"),
    "-PullModels", "-BuildAll"
)
if ($SkipDriveCheck) { $setupArgs += "-SkipDriveCheck" }

Write-Log "Starting setup-compose-for-agents -PullModels -BuildAll ..."
& "C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe" @setupArgs *>&1 | Tee-Object -FilePath $log -Append
$code = $LASTEXITCODE
Write-Log "Finished with exit code $code"
exit $code
