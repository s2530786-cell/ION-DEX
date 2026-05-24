# Cursor Auto-Click background script (PowerShell)
# Sends Ctrl+Enter + Enter every 3 seconds to Cursor window
# to auto-dismiss popup dialogs during automated development.

$src = @"
using System;
using System.Runtime.InteropServices;
public class Win32 {
    [DllImport("user32.dll")]
    public static extern IntPtr GetForegroundWindow();
    
    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder text, int count);
    
    [DllImport("user32.dll")]
    public static extern bool PostMessage(IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);
}
"@

Add-Type -TypeDefinition $src -Language CSharp

$replyDelay = 25
$interval = 3

function Test-CursorActive {
    $hwnd = [Win32]::GetForegroundWindow()
    $sb = New-Object System.Text.StringBuilder 256
    [Win32]::GetWindowText($hwnd, $sb, 256)
    $title = $sb.ToString()
    return $title -like '*cursor*' -or $title -like '*Cursor*' -or $title -like '*ion*' -or $title -like '*ION*'
}

function Send-EnterKeys {
    param([IntPtr]$hwnd)
    [Win32]::PostMessage($hwnd, 0x0100, [IntPtr]0xA2, [IntPtr]0)  # Ctrl down
    Start-Sleep -Milliseconds $replyDelay
    [Win32]::PostMessage($hwnd, 0x0100, [IntPtr]0x0D, [IntPtr]0)  # Enter down
    Start-Sleep -Milliseconds $replyDelay
    [Win32]::PostMessage($hwnd, 0x0101, [IntPtr]0x0D, [IntPtr]0)  # Enter up
    Start-Sleep -Milliseconds $replyDelay
    [Win32]::PostMessage($hwnd, 0x0101, [IntPtr]0xA2, [IntPtr]0)  # Ctrl up
    
    Start-Sleep -Milliseconds 100
    
    [Win32]::PostMessage($hwnd, 0x0100, [IntPtr]0x0D, [IntPtr]0)  # Enter down
    Start-Sleep -Milliseconds $replyDelay
    [Win32]::PostMessage($hwnd, 0x0101, [IntPtr]0x0D, [IntPtr]0)  # Enter up
}

Write-Host '=== Cursor Auto-Click Started ==='
Write-Host 'Auto-dismissing popups every 3 seconds'
Write-Host 'Press Ctrl+C to stop'

$count = 0

while ($true) {
    if (Test-CursorActive) {
        $hwnd = [Win32]::GetForegroundWindow()
        Send-EnterKeys -hwnd $hwnd
        $count = $count + 1
        if (($count % 20) -eq 0) {
            $msg = 'Sent ' + $count.ToString() + ' clicks'
            Write-Host $msg
        }
    }
    Start-Sleep -Seconds $interval
}
