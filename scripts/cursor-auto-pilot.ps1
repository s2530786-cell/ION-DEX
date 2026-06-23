# Cursor Full Auto-Pilot
# Kills old processes, launches desktop, pastes command, monitors every 5 min.

$ws = "D:\openclaw-tools\ion-dex-nuke"
$ce = "C:\Users\admin\AppData\Local\Programs\cursor\_\Cursor.exe"
$ac = "D:\openclaw-tools\ion-dex-nuke\scripts\cursor-auto-click.ps1"
$interval = 300

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class W32 {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

function KillOld {
    Write-Host "[AUTO] Killing old..."
    Get-Process -Name Cursor -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 3
}

function LaunchNew {
    Write-Host "[AUTO] Launching Cursor..."
    Start-Process -FilePath $ce -ArgumentList $ws
    $t = 0
    while ($t -lt 30) {
        $ps = Get-Process -Name Cursor -ErrorAction SilentlyContinue
        foreach ($p in $ps) {
            if ($p.MainWindowHandle -ne 0) {
                Write-Host "[AUTO] Ready PID=$($p.Id)"
                return $p.Id
            }
        }
        Start-Sleep 1
        $t++
    }
    Write-Host "[AUTO] No window"
    return $null
}

function PasteCmd {
    Write-Host "[AUTO] Paste+Send..."
    Start-Sleep 2
    $ps = Get-Process -Name Cursor -ErrorAction SilentlyContinue
    $hwnd = $null
    foreach ($p in $ps) { if ($p.MainWindowHandle -ne 0) { $hwnd = $p.MainWindowHandle; break } }
    if (-not $hwnd) { Write-Host "[AUTO] No window"; return }
    [W32]::ShowWindow($hwnd, 9)
    [W32]::SetForegroundWindow($hwnd)
    Start-Sleep 1
    $w = New-Object -ComObject wscript.shell
    $w.SendKeys("^a"); Start-Sleep 0.2
    $w.SendKeys("^v"); Start-Sleep 0.5
    $w.SendKeys("^~"); Start-Sleep 0.3
    $w.SendKeys("~")
    Write-Host "[AUTO] Sent!"
}

function StartClicker {
    Write-Host "[AUTO] Clicker daemon..."
    Get-Process -Name powershell -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*cursor-auto-click*' } | Stop-Process -Force -ErrorAction SilentlyContinue
    Start-Process -WindowStyle Hidden powershell "-NoProfile -ExecutionPolicy Bypass -File `"$ac`""
}

function IsStuck {
    $ps = Get-Process -Name Cursor -ErrorAction SilentlyContinue
    if ($ps.Count -eq 0) { return $true }
    foreach ($p in $ps) { if ($p.MainWindowHandle -ne 0) { return $false } }
    return $true
}

# --- MAIN ---
Write-Host "===== Cursor Auto-Pilot ====="
KillOld
LaunchNew
Start-Sleep 5
PasteCmd
StartClicker

while ($true) {
    Start-Sleep $interval
    if (IsStuck) {
        Write-Host "[RELOAD] Stuck! Restarting..."
        KillOld
        Start-Sleep 3
        LaunchNew
        Start-Sleep 5
        PasteCmd
    } else {
        Write-Host "[OK] Running"
    }
}
