; SimpleDispatch.ahk — One shot: open Cursor Composer and type
#Requires AutoHotkey v2.0
#SingleInstance Force
SetTitleMatchMode "RegEx"

; Maximize and focus Cursor
WinActivate "ion-dex-nuke.*Cursor"
WinWaitActive "ion-dex-nuke.*Cursor",, 5
Sleep 1000
Send "#{Up}"
Sleep 500

; Open Composer (Agent panel)
Send "^+l"
Sleep 3000

; Clear anything in input
Send "^a"
Sleep 200

; Type the task  
SendInput "Fix all FunC compilation errors. Run: node scripts/compile-func.mjs. Read the output. Fix each error. Recompile. Repeat until all 22 contracts compile clean. Auto-accept all changes. Commit when done."
Sleep 500

; Submit as agent task
Send "^+{Enter}"
Sleep 1000

ExitApp
