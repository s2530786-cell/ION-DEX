# Restore hermes-agent (and optional MCP_DOCKER docker.exe path) in .cursor/mcp.json
# UTF-8 without BOM
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent $PSScriptRoot
if (-not (Test-Path (Join-Path $RepoRoot "hermes-agent"))) {
    $RepoRoot = "D:\openclaw-tools\ion-dex-nuke"
}

$McpPath = Join-Path $RepoRoot ".cursor\mcp.json"
$HermesExe = Join-Path $RepoRoot "hermes-agent\venv\Scripts\hermes.exe"
$HermesHome = Join-Path $env:LOCALAPPDATA "hermes"

if (-not (Test-Path $HermesExe)) {
    Write-Error "hermes.exe not found: $HermesExe — run hermes-agent install first."
}

$dockerExe = "C:\Program Files\Docker\Docker\resources\bin\docker.exe"
$profile = if ($env:ION_DOCKER_MCP_PROFILE) { $env:ION_DOCKER_MCP_PROFILE } else { "dev_workflow" }

$hermesBlock = @{
    command = $HermesExe
    args    = @("mcp", "serve")
    env     = @{ HERMES_HOME = $HermesHome }
}

if (Test-Path $McpPath) {
    $raw = Get-Content -Path $McpPath -Raw -Encoding UTF8
    $cfg = $raw | ConvertFrom-Json
} else {
    $cfg = [pscustomobject]@{ mcpServers = [pscustomobject]@{} }
}

if (-not $cfg.mcpServers) {
    $cfg | Add-Member -NotePropertyName mcpServers -NotePropertyValue ([pscustomobject]@{})
}

$servers = @{}
$cfg.mcpServers.PSObject.Properties | ForEach-Object { $servers[$_.Name] = $_.Value }
$servers["hermes-agent"] = $hermesBlock

if ($servers.ContainsKey("MCP_DOCKER") -and (Test-Path $dockerExe)) {
    $dg = $servers["MCP_DOCKER"]
    if ($dg.command -eq "docker") {
        $dg.command = $dockerExe
    }
    if (-not $dg.env) {
        $dg | Add-Member -NotePropertyName env -NotePropertyValue ([pscustomobject]@{})
    }
    $dg.env.LOCALAPPDATA = $env:LOCALAPPDATA
    $dg.env.ProgramData = $env:ProgramData
    $dg.env.ProgramFiles = ${env:ProgramFiles}
    if (-not $dg.args -or $dg.args.Count -lt 3) {
        $dg.args = @("mcp", "gateway", "run", "--profile", $profile)
    }
    $servers["MCP_DOCKER"] = $dg
}

$ordered = [ordered]@{}
@("hermes-agent", "desktop-commander", "ion-dex-memory-bank", "MCP_DOCKER") | ForEach-Object {
    if ($servers.ContainsKey($_)) { $ordered[$_] = $servers[$_] }
}
$cfg.mcpServers.PSObject.Properties.Name | Where-Object { $_ -notin $ordered.Keys } | ForEach-Object {
    $ordered[$_] = $servers[$_]
}

$out = @{ mcpServers = $ordered }
$json = $out | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText($McpPath, $json + "`n", [System.Text.UTF8Encoding]::new($false))
Write-Host "Updated $McpPath — hermes-agent restored. Restart Cursor."
