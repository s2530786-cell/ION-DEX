Add-Type -AssemblyName System.Windows.Forms

Add-Type @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")] public static extern IntPtr FindWindow(string className, string windowName);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
}
"@

# Find Cursor window (Electron/Chromium-based)
$windows = 0
$found = $false
# Search for Cursor windows
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class EnumWin {
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@

$cursorPids = (Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowTitle -ne "" }).Id

$foundWindows = New-Object System.Collections.ArrayList

$callback = {
    param($hwnd, $lParam)
    $sb = New-Object System.Text.StringBuilder(512)
    [EnumWin]::GetWindowText($hwnd, $sb, 512) | Out-Null
    $title = $sb.ToString()
    $pid = 0
    [EnumWin]::GetWindowThreadProcessId($hwnd, [ref]$pid) | Out-Null
    $visible = [EnumWin]::IsWindowVisible($hwnd)
    if ($pid -in $cursorPids -and $visible -and $title -ne "") {
        [void]$foundWindows.Add(@{HWND=$hwnd; Title=$title})
    }
    return $true
}

[EnumWin]::EnumWindows($callback, [IntPtr]::Zero) | Out-Null

if ($foundWindows.Count -eq 0) {
    Write-Host "No visible Cursor windows found"
    exit 1
}

# Use the largest/main window
$main = $foundWindows | Sort-Object { $_.Title.Length } -Descending | Select-Object -First 1
Write-Host "Found: $($main.HWND) '$($main.Title)'"

# Show and focus
[Win32]::ShowWindow($main.HWND, 9) | Out-Null  # SW_RESTORE
Start-Sleep 0.5
[Win32]::SetForegroundWindow($main.HWND) | Out-Null
Start-Sleep 0.5

# Ctrl+Shift+L to open agent
[System.Windows.Forms.SendKeys]::SendWait("^+l")
Start-Sleep 3

# Type the command
[System.Windows.Forms.SendKeys]::SendWait("Read SESSION_STATE.md Current Task section. Start with Task 1: Audit all existing contracts. Work autonomously.")
Start-Sleep 0.3
[System.Windows.Forms.SendKeys]::SendWait("{ENTER}")

Write-Host "Command sent to Cursor"
