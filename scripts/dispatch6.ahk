; dispatch6.ahk - Keyboard-only, no mouse clicks
#Requires AutoHotkey v2.0
#SingleInstance Force

; Ensure Cursor is active
WinActivate "ion-dex-nuke"
Sleep 1500

; Maximize
Send "#{Up}"
Sleep 1000

; Open Agent panel
Send "^+l"
Sleep 2000

; Type task directly
SendInput "Start Task 2. Read SESSION_STATE.md. Compile contracts/ion/*.fc. Fix errors. Auto-accept all changes."
Sleep 800

; Run
Send "^+{Enter}"
Sleep 500

ExitApp
