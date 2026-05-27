# Setup docker/compose-for-agents — clone, external repos, secrets templates, optional model pull/build
# UTF-8 without BOM
param(
    [switch]$PullModels,
    [switch]$BuildAll,
    [switch]$ExportMcpSecrets,
    [string]$OpenAiKeyFile = "",
    [string]$DataRoot = "D:\Docker\ion-dex",
    [switch]$SkipDriveCheck
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$CfaRoot = Join-Path $RepoRoot "tools\compose-for-agents"
$ExtRoot = Join-Path $RepoRoot "tools\compose-for-agents-external"
$Docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
if (-not (Test-Path $Docker)) { $Docker = "docker" }

$LogDir = Join-Path $DataRoot "logs"
$TempDir = Join-Path $DataRoot "temp"
New-Item -ItemType Directory -Force -Path $LogDir, $TempDir | Out-Null
$env:TEMP = $TempDir
$env:TMP = $TempDir

function Write-Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

function Get-DockerDataVhdxPath {
    $wsl = Join-Path $env:LOCALAPPDATA "Docker\wsl"
    if (-not (Test-Path $wsl)) { return $null }
    Get-ChildItem $wsl -Recurse -Filter "docker_data.vhdx" -ErrorAction SilentlyContinue | Select-Object -First 1
}

function Test-DockerDataOnDDrive {
    $wsl = Join-Path $env:LOCALAPPDATA "Docker\wsl"
    if (Test-Path $wsl) {
        $item = Get-Item $wsl -Force
        if ($item.Attributes -band [IO.FileAttributes]::ReparsePoint) {
            $target = $item.Target
            if ($target -is [string]) { return $target -like "D:\*" }
            if ($target -and $target.Count -gt 0) { return ($target[0] -like "D:\*") }
        }
    }
    $vhdx = Get-DockerDataVhdxPath
    return ($vhdx -and $vhdx.FullName -like "D:\*")
}

function Assert-DockerNotOnCBeforeHeavyOps {
    if ($SkipDriveCheck) { return }
    if (-not ($PullModels -or $BuildAll)) { return }
    if (Test-DockerDataOnDDrive) {
        Write-Host "Docker data disk on D: — OK for -PullModels / -BuildAll"
        return
    }
    $vhdx = Get-DockerDataVhdxPath
    $where = if ($vhdx) { $vhdx.FullName } else { "unknown" }
    Write-Error @"
PullModels/BuildAll would grow C: drive Docker WSL disk (currently: $where).
Run as Administrator first:
  scripts\migrate-docker-wsl-junction-to-d.ps1 -Force
Then restart Docker Desktop and re-run this script.
Or pass -SkipDriveCheck only if you accept C: disk usage.
"@
}

function Test-DockerReady {
    & $Docker --version | Out-Null
    & $Docker compose version | Out-Null
    $mr = & $Docker model version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "Docker Model Runner unavailable. Local-model demos need GPU or compose.openai.yaml / Docker Offload."
    } else {
        Write-Host "Docker Model Runner: OK"
    }
}

function Ensure-Repo {
    if (Test-Path (Join-Path $CfaRoot ".git")) { return }
    Write-Step "Clone compose-for-agents"
    New-Item -ItemType Directory -Force -Path (Split-Path $CfaRoot) | Out-Null
    $env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\Git\bin;" + $env:PATH
    git clone --depth 1 https://github.com/docker/compose-for-agents.git $CfaRoot
}

function Clone-External {
    Write-Step "Clone external demo repositories"
    New-Item -ItemType Directory -Force -Path $ExtRoot | Out-Null
    $env:PATH = "C:\Program Files\Git\cmd;C:\Program Files\Git\bin;" + $env:PATH
    $repos = @(
        @{ Name = "scira-mcp-chat"; Url = "https://github.com/slimslenderslacks/scira-mcp-chat.git" },
        @{ Name = "tripper"; Url = "https://github.com/embabel/tripper.git" },
        @{ Name = "minions"; Url = "https://github.com/HazyResearch/minions.git" }
    )
    foreach ($r in $repos) {
        $dest = Join-Path $ExtRoot $r.Name
        if (Test-Path (Join-Path $dest ".git")) {
            Write-Host "  skip $($r.Name) (exists)"
            continue
        }
        Write-Host "  clone $($r.Name)..."
        git clone --depth 1 $r.Url $dest
    }
}

function Copy-IfMissing($src, $dst) {
    if ((Test-Path $src) -and -not (Test-Path $dst)) {
        Copy-Item $src $dst
        Write-Host "  created $dst"
    }
}

function Prepare-Secrets {
    Write-Step "Prepare .mcp.env and OpenAI secret templates"
    $inRepo = @(
        "a2a", "adk", "adk-cerebras", "adk-sock-shop", "agno", "akka",
        "crew-ai", "langchaingo", "langgraph", "spring-ai"
    )
    foreach ($d in $inRepo) {
        $dir = Join-Path $CfaRoot $d
        if (-not (Test-Path $dir)) { continue }
        Copy-IfMissing (Join-Path $dir ".mcp.env.example") (Join-Path $dir ".mcp.env")
        $openAiExample = Join-Path $dir "secret.openai-api-key.example"
        $openAiSecret = Join-Path $dir "secret.openai-api-key"
        if (-not (Test-Path $openAiExample)) {
            $content = @"
# Paste OpenAI API key (single line, sk-...)
# Then: docker compose -f compose.yaml -f compose.openai.yaml up --build
REPLACE_WITH_YOUR_OPENAI_API_KEY
"@
            [System.IO.File]::WriteAllText($openAiExample, $content.TrimEnd() + "`n", [System.Text.UTF8Encoding]::new($false))
        }
        if ($OpenAiKeyFile -and (Test-Path $OpenAiKeyFile) -and -not (Test-Path $openAiSecret)) {
            Copy-Item $OpenAiKeyFile $openAiSecret
            Write-Host "  copied OpenAI secret -> $d"
        }
        if (-not (Test-Path (Join-Path $dir ".mcp.env"))) {
            $mcpTpl = @"
# MCP secrets for $d — fill or run: docker mcp secret export ... > .mcp.env
# See docs/compose-for-agents-setup.md
"@
            [System.IO.File]::WriteAllText((Join-Path $dir ".mcp.env"), ($mcpTpl.TrimEnd() + "`n"), [System.Text.UTF8Encoding]::new($false))
        }
    }
    $vercelDir = Join-Path $ExtRoot "scira-mcp-chat"
    if (Test-Path $vercelDir) {
        $mcp = Join-Path $vercelDir ".mcp.env"
        if (-not (Test-Path $mcp)) {
            New-Item -ItemType File -Path $mcp -Force | Out-Null
        }
    }
    $tripper = Join-Path $ExtRoot "tripper"
    if (Test-Path $tripper) {
        $mcp = Join-Path $tripper ".mcp.env"
        if (-not (Test-Path $mcp)) { New-Item -ItemType File -Path $mcp -Force | Out-Null }
    }
}

function Export-McpSecretsFromDocker {
    if (-not $ExportMcpSecrets) { return }
    Write-Step "Export Docker MCP secrets (requires secrets in Docker Desktop)"
    $agnoDir = Join-Path $CfaRoot "agno"
    if (Test-Path $agnoDir) {
        & $Docker mcp secret export github-official 2>$null | Out-File (Join-Path $agnoDir ".mcp.env") -Encoding utf8NoBOM
    }
    $sock = Join-Path $CfaRoot "adk-sock-shop"
    if (Test-Path $sock) {
        & $Docker mcp secret export brave resend mongodb 2>$null | Out-File (Join-Path $sock ".mcp.env") -Encoding utf8NoBOM
    }
}

function Pull-CommonModels {
    if (-not $PullModels) { return }
    Assert-DockerNotOnCBeforeHeavyOps
    Write-Step "Pull Docker Model Runner models (large downloads)"
    $models = @(
        "ai/qwen3:8B-Q4_0",
        "ai/qwen3",
        "ai/gemma3:4B-Q4_0",
        "ai/gemma3-qat",
        "ai/llama3.2"
    )
    foreach ($m in $models) {
        Write-Host "  pull $m ..."
        & $Docker model pull $m
        if ($LASTEXITCODE -ne 0) { Write-Warning "  failed: $m (GPU/Offload/OpenAI fallback may be required)" }
    }
}

function Build-AllDemos {
    if (-not $BuildAll) { return }
    Assert-DockerNotOnCBeforeHeavyOps
    Write-Step "docker compose build (all in-repo demos — may take a long time)"
    $inRepo = Get-ChildItem $CfaRoot -Directory | Where-Object { Test-Path (Join-Path $_.FullName "compose.yaml") }
    foreach ($d in $inRepo) {
        Write-Host "  build $($d.Name)..."
        Push-Location $d.FullName
        & $Docker compose build 2>&1 | Out-Null
        Pop-Location
    }
}

Write-Host "ION DEX — compose-for-agents setup" -ForegroundColor Green
Write-Step "Check Docker"
Test-DockerReady
Ensure-Repo
Clone-External
Prepare-Secrets
Export-McpSecretsFromDocker
Pull-CommonModels
Build-AllDemos

Write-Host "`nDone. Read docs/compose-for-agents-setup.md" -ForegroundColor Green
Write-Host "Start a demo: scripts/compose-agents-up.ps1 -Demo agno" -ForegroundColor Yellow
