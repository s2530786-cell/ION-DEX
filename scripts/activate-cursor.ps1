# Force activate Cursor window by process name
Add-Type @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public class WinApi {
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("user32.dll")] public static extern int GetWindowText(IntPtr hWnd, StringBuilder t, int max);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr hWnd);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr hWnd, out RECT r);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
}
public struct RECT { public int L, T, R, B; }
"@

$cursorProcs = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue | % { $_.Id }
$foundRect = $null
$foundHwnd = [IntPtr]::Zero

$cb = [WinApi+EnumWindowsProc]{
    param($hWnd, $lParam)
    $pid = 0u
    [WinApi]::GetWindowThreadProcessId($hWnd, [ref]$pid) | Out-Null
    if ($pid -in $cursorProcs -and [WinApi]::IsWindowVisible($hWnd)) {
        $sb = New-Object Text.StringBuilder(256)
        [WinApi]::GetWindowText($hWnd, $sb, 256) | Out-Null
        $title = $sb.ToString()
        if ($title.Length -gt 0) {
            $r = New-Object RECT
            [WinApi]::GetWindowRect($hWnd, [ref]$r) | Out-Null
            $w = $r.R - $r.L
            $h = $r.B - $r.T
            Write-Output "Found: '$title' HWND=$hWnd Rect=($($r.L),$($r.T),$($r.R),$($r.B)) Size=$($w)x$($h)"
            if ($w -gt 800 -and $h -gt 600) {
                $script:foundHwnd = $hWnd
                $script:foundRect = $r
            }
        }
    }
    return $true
}

[WinApi]::EnumWindows($cb, [IntPtr]::Zero) | Out-Null

if ($foundHwnd -eq [IntPtr]::Zero) {
    Write-Output "ERROR: No Cursor window found"
    exit 1
}

# Force to foreground
[WinApi]::ShowWindow($foundHwnd, 9) | Out-Null  # SW_RESTORE
[WinApi]::SetForegroundWindow($foundHwnd) | Out-Null
Start-Sleep -Milliseconds 500

Write-Output "Activated Cursor window at $($foundRect.L),$($foundRect.T) $($foundRect.R)x$($foundRect.B)"
Write-Output "RECT:$($foundRect.L),$($foundRect.T),$($foundRect.R),$($foundRect.B)"
