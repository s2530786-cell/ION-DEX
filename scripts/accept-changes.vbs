Set WshShell = CreateObject("WScript.Shell")
WshShell.AppActivate "Cursor"
WScript.Sleep 500
' Press Escape to dismiss IME
WshShell.SendKeys "{ESC}"
WScript.Sleep 200
WshShell.SendKeys "{ESC}"
WScript.Sleep 200
' Click somewhere to focus the chat area
WshShell.SendKeys "{TAB}"
WScript.Sleep 100
WshShell.SendKeys "{TAB}"
WScript.Sleep 100
WshShell.SendKeys "{TAB}"
WScript.Sleep 100
' Try Ctrl+Enter to accept changes
WshShell.SendKeys "^~"
WScript.Sleep 500
' Also try just ~ (Enter) 
WshShell.SendKeys "~"
