# Free ION DEX local dev ports (frontend Vite + stray listeners).
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$Ports = @(3001, 3002, 3003, 3004, 3010, 5173)

Set-Location "$Root\frontend"
Write-Host "Freeing ports: $($Ports -join ', ') ..."
npx --yes kill-port @Ports 2>&1 | ForEach-Object { Write-Host $_ }
Start-Sleep -Seconds 2

foreach ($port in $Ports) {
  $conn = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1
  if ($conn) {
    $ownPid = $conn.OwningProcess
    Write-Host "WARN: port $port still held by PID $ownPid (close that terminal or: taskkill /F /PID $ownPid /T)"
  }
}
