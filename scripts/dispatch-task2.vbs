Set WshShell = CreateObject("WScript.Shell")
' Activate Cursor
WshShell.AppActivate "ion-dex-nuke"
WScript.Sleep 800
' Clear any IME
WshShell.SendKeys "{ESC}"
WScript.Sleep 200
WshShell.SendKeys "{ESC}"
WScript.Sleep 200
' Open Composer
WshShell.SendKeys "^+l"
WScript.Sleep 800
' Type task - all ASCII, no Chinese to avoid IME
WshShell.SendKeys "Continue from Task 2. Read SESSION_STATE.md Task 2. Install FunC compiler if needed. Compile all .fc contracts. Fix all compile errors. Auto-accept. Do not stop for confirmation."
WScript.Sleep 500
' Submit
WshShell.SendKeys "~"
WScript.Sleep 300
WshShell.SendKeys "^+{Enter}"
