# Start one compose-for-agents demo
# UTF-8 without BOM
param(
    [Parameter(Mandatory = $true)]
    [ValidateSet(
        "a2a", "adk", "adk-cerebras", "adk-sock-shop", "agno", "akka", "crew-ai",
        "langchaingo", "langgraph", "spring-ai",
        "vercel", "embabel", "minions"
    )]
    [string]$Demo,
    [switch]$OpenAI,
    [switch]$Offload,
    [switch]$Detach
)

$ErrorActionPreference = "Stop"
$RepoRoot = Split-Path -Parent $PSScriptRoot
$CfaRoot = Join-Path $RepoRoot "tools\compose-for-agents"
$ExtRoot = Join-Path $RepoRoot "tools\compose-for-agents-external"
$Docker = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
if (-not (Test-Path $Docker)) { $Docker = "docker" }

$externalMap = @{
    vercel  = Join-Path $ExtRoot "scira-mcp-chat"
    embabel = Join-Path $ExtRoot "tripper"
    minions = Join-Path $ExtRoot "minions\apps\minions-docker"
}

if ($externalMap.ContainsKey($Demo)) {
    $workDir = $externalMap[$Demo]
    if (-not (Test-Path $workDir)) {
        Write-Error "Missing $workDir — run scripts/setup-compose-for-agents.ps1 first"
    }
} else {
    $workDir = Join-Path $CfaRoot $Demo
}

$composeFile = "compose.yaml"
if ($Demo -eq "adk-cerebras") { $composeFile = "compose.yml" }
if ($Demo -eq "minions") { $composeFile = "docker-compose.minions.yml" }

$args = @("compose", "-f", $composeFile)
if ($OpenAI -and (Test-Path (Join-Path $workDir "compose.openai.yaml"))) {
    $args += @("-f", "compose.openai.yaml")
}
if ($Offload -and (Test-Path (Join-Path $workDir "compose.offload.yaml"))) {
    $args += @("-f", "compose.offload.yaml")
}
$args += @("up", "--build")
if ($Detach) { $args += "-d" }

Write-Host "cd $workDir"
Write-Host "$Docker $($args -join ' ')"
Push-Location $workDir
try {
    & $Docker @args
} finally {
    Pop-Location
}
