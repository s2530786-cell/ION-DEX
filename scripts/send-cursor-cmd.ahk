#Requires AutoHotkey v2.0
#SingleInstance Force

; Activate Cursor
WinActivate "ahk_exe Cursor.exe"
Sleep 2000

; Open Composer (Ctrl+I)
Send "^i"
Sleep 3000

; Paste command
Send "^v"
Sleep 1500

; Submit (Ctrl+Shift+Enter)
Send "+^{Enter}"
Sleep 500

ExitApp
