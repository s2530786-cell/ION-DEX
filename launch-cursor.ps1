$p = Get-Process -Name Cursor -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 }
if ($p) {
    Write-Host "Cursor desktop window already exists PID=$($p[0].Id)"
    exit 0
}
Write-Host "No desktop window found. Launching Cursor..."
Start-Process -FilePath "C:\Users\admin\AppData\Local\Programs\cursor\Cursor.exe" -ArgumentList "D:\openclaw-tools\ion-dex-nuke"
Write-Host "Done."
exit 0
