' auto-accept-review.vbs — 自动关闭 Cursor Review/Keep All 弹窗
' 用途：定期发送 Enter 和 Ctrl+Enter 点掉 Cursor 的 Review 弹窗
' 由 HEARTBEAT.md 心跳触发，无副作用（无弹窗时按键无害）

Set WshShell = CreateObject("WScript.Shell")

' 尝试激活 Cursor 窗口
On Error Resume Next
WshShell.AppActivate "Cursor"
If Err.Number = 0 Then
    ' 窗口存在，发送按键
    WshShell.SendKeys "~"        ' Enter — 关闭普通弹窗/确认
    WScript.Sleep 200
    WshShell.SendKeys "^~"       ' Ctrl+Enter — Cursor Review/Keep All
End If
On Error Goto 0
