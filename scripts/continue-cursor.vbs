Set WshShell = CreateObject("WScript.Shell")
WshShell.AppActivate "Cursor"
WScript.Sleep 500
' Press Escape to dismiss IME/dialogs
WshShell.SendKeys "{ESC}"
WScript.Sleep 300
WshShell.SendKeys "{ESC}"
WScript.Sleep 300
' Select all text in input and clear
WshShell.SendKeys "^a"
WScript.Sleep 100
WshShell.SendKeys "{DELETE}"
WScript.Sleep 200
' Switch to English input mode
WshShell.SendKeys "%+"
WScript.Sleep 200
' Type the command
WshShell.SendKeys "Continue. Do not ask for confirmation. Auto-accept all changes. Work through all 5 tasks autonomously."
WScript.Sleep 200
' Submit
WshShell.SendKeys "~"
