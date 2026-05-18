; dispatch4.ahk - Use Cursor command palette to open Agent directly
#Requires AutoHotkey v2.0
#SingleInstance Force

WinActivate "ion-dex-nuke"
Sleep 1000

; Step 1: Cursor AI Panel -> use View menu shortcut
; Try to open specific Cursor AI panel
Send "^+{F1}"
Sleep 500

; Step 2: Use Ctrl+Shift+I which is Cursor's "Composer: Focus"  
Send "^+i"
Sleep 1500

; Step 3: Click center of Composer panel (right side, bottom-mid)
MouseClick "left", 1200, 800
Sleep 500

; Step 4: Type task
SendInput "Start Task 2. Compile contracts/ion/*.fc. Fix errors. Auto-accept all. Go."
Sleep 500

; Step 5: Submit
Send "^+{Enter}"
Sleep 500

ExitApp
