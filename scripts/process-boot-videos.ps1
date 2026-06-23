# Process Doubao-sourced boot MP4s: remove corner watermark, upscale to 1080p cinema profile.
# Usage:
#   .\scripts\process-boot-videos.ps1
#   .\scripts\process-boot-videos.ps1 -SourceSquare "D:\path\ION DEX 开机动画.mp4" -SourcePortrait "D:\path\kaijidongION DEX.mp4"

param(
  [string]$SourceSquare = "$env:USERPROFILE\Downloads\ION DEX 开机动画.mp4",
  [string]$SourcePortrait = "$env:USERPROFILE\Downloads\kaijidongION DEX.mp4",
  [string]$OutDir = "$PSScriptRoot\..\frontend\public\boot"
)

$ErrorActionPreference = "Stop"
if (-not (Get-Command ffmpeg -ErrorAction SilentlyContinue)) {
  throw "ffmpeg not found on PATH"
}

foreach ($path in @($SourceSquare, $SourcePortrait)) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Missing source video: $path"
  }
}

New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

$outCyberLegacy = Join-Path $OutDir "boot-ion-cyber.mp4"
$outMatrixLegacy = Join-Path $OutDir "boot-ion-matrix.mp4"
$outCyber = $outCyberLegacy
$outMatrix = $outMatrixLegacy

$fcSquare = "delogo=x=500:y=640:w=210:h=70,scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,unsharp=5:5:0.85:5:5:0.0,eq=contrast=1.05:brightness=0.02:saturation=1.12"
$fcPortrait = "delogo=x=500:y=1210:w=210:h=65,scale=-2:1080:flags=lanczos,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=black,unsharp=5:5:0.85:5:5:0.0,eq=contrast=1.05:brightness=0.02:saturation=1.12"
$encode = @("-c:v", "libx264", "-preset", "medium", "-crf", "18", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-c:a", "aac", "-b:a", "192k")

Write-Host "Encoding cyber (square -> 1920x1080)..."
& ffmpeg -y -i $SourceSquare -vf $fcSquare @encode $outCyber
Write-Host "Encoding matrix (portrait -> 1920x1080)..."
& ffmpeg -y -i $SourcePortrait -vf $fcPortrait @encode $outMatrix

$variants = @("landscape-1080p", "landscape-4k", "portrait-1080p")
foreach ($clip in @(
    @{ id = "cyber"; src = $outCyberLegacy },
    @{ id = "matrix"; src = $outMatrixLegacy }
  )) {
  foreach ($v in $variants) {
    $dest = Join-Path $OutDir ("boot-ion-{0}-{1}.mp4" -f $clip.id, $v)
    Copy-Item -LiteralPath $clip.src -Destination $dest -Force
  }
}

Get-ChildItem $OutDir -Filter "*.mp4" | Format-Table Name, @{N="MB";E={[math]::Round($_.Length/1MB,2)}} -AutoSize
Write-Host "Done. Boot carousel reads boot-ion-{cyber|matrix|intro}-{landscape-1080p|landscape-4k|portrait-1080p}.mp4"
