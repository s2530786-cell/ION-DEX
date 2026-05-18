' Auto-accept Cursor dialogs: Review, Confirm, Allow, everything
' Run periodically to keep Cursor moving without human intervention

Set WshShell = CreateObject("WScript.Shell")

' Focus Cursor project window
WshShell.AppActivate "ion-dex-nuke"
WScript.Sleep 500

' Press Escape to clear floating UI
WshShell.SendKeys "{ESC}"
WScript.Sleep 200
WshShell.SendKeys "{ESC}"
WScript.Sleep 200

' Send Ctrl+Enter for Keep All / Accept changes
WshShell.SendKeys "^~"
WScript.Sleep 300

' Press Enter 3 times for various confirm dialogs (Allow, Continue, Confirm)
WshShell.SendKeys "~"
WScript.Sleep 200
WshShell.SendKeys "~"
WScript.Sleep 200
WshShell.SendKeys "~"
WScript.Sleep 200

' Ctrl+Enter again for good measure
WshShell.SendKeys "^~"
