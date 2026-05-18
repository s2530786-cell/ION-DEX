; dispatch5.ahk - Maximize window first, then open Composer and type
#Requires AutoHotkey v2.0
#SingleInstance Force

; Wait for Cursor to fully settle
Sleep 5000

; Activate and maximize
WinActivate "ion-dex-nuke"
Sleep 1000
WinMaximize "ion-dex-nuke"
Sleep 1000

; Click center of window to ensure focus
WinGetPos &wx, &wy, &ww, &wh, "ion-dex-nuke"
MouseClick "left", wx+ww//2, wy+wh//2
Sleep 500

; Open Agent/Composer: Ctrl+Shift+L
Send "^+l"
Sleep 2000

; Click input area (bottom of Composer panel)
MouseClick "left", wx+ww-150, wy+wh-40
Sleep 500

; Type task
SendInput "Start Task 2. Read SESSION_STATE.md. Compile contracts/ion/*.fc. Auto-accept all. Go."
Sleep 500

; Submit
Send "^+{Enter}"
Sleep 500

ExitApp
