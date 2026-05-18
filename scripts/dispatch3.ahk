; dispatch3.ahk - Use Ctrl+Shift+L for Composer
#Requires AutoHotkey v2.0
#SingleInstance Force

WinActivate "ion-dex-nuke"
Sleep 1000

; Open Composer: Ctrl+Shift+L
Send "^+l"
Sleep 1500

; Click in the Composer input area
MouseClick "left", 1100, 860
Sleep 500

; Type task
Send "Start Task 2. Compile contracts/ion/*.fc. Fix compile errors. Auto-accept."
Sleep 500

; Ctrl+Shift+Enter to run
Send "^+{Enter}"
Sleep 500

ExitApp
