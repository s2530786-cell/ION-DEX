; dispatch.ahk - Send task to Cursor Composer
#Requires AutoHotkey v2.0
#SingleInstance Force

; Wait for Cursor to fully load (15 processes)
Sleep 15000

; Activate Cursor window
WinActivate "ion-dex-nuke"
Sleep 1000

; Click composer input area (bottom-right of Cursor window)
; Window: 1280x800, input at ~1000:870 absolute
MouseClick "left", 1120, 870
Sleep 500

; Clear any IME / existing text
Send "{Escape}"
Sleep 300
Send "{Escape}"
Sleep 300

; Type task - short and direct
Send "Compile all FunC contracts in contracts/ion/. Fix errors. Auto-accept."
Sleep 500

; Submit
Send "{Enter}"
Sleep 300
Send "^+{Enter}"
Sleep 300

ExitApp
