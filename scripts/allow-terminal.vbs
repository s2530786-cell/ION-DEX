Set WshShell = CreateObject("WScript.Shell")
WshShell.AppActivate "Cursor"
WScript.Sleep 500
' Press Escape then click Allow area
WshShell.SendKeys "{ESC}"
WScript.Sleep 200
' Try tabbing to Allow button then pressing Enter
WshShell.SendKeys "{TAB}"
WScript.Sleep 100
WshShell.SendKeys "{TAB}"
WScript.Sleep 100
WshShell.SendKeys "{TAB}"
WScript.Sleep 100
WshShell.SendKeys "~"
WScript.Sleep 300
' Also send Ctrl+Enter which is often "accept"
WshShell.SendKeys "^~"
