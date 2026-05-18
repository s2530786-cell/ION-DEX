; dispatch2.ahk - Open Cursor Agent and send task
#Requires AutoHotkey v2.0
#SingleInstance Force

; Activate and wait
WinActivate "ion-dex-nuke"
Sleep 1000

; Open Command Palette
Send "^+p"
Sleep 800

; Search for "Agent" mode
Send "agent"
Sleep 500
Send "{Enter}"
Sleep 1500

; Now click the chat input area (bottom of the agent panel)
; Cursor window at (26,104) 1280x800, input should be bottom-right area
MouseClick "left", 1100, 860
Sleep 500

; Type task
Send "Start Task 2. Compile FunC contracts in contracts/ion/. Fix all errors. Auto-accept changes."
Sleep 500

; Submit with Ctrl+Enter
Send "^+{Enter}"

Sleep 1000
ExitApp
