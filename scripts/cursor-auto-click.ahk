; Cursor 自动点确认脚本
; 每 3 秒扫描一次，点掉弹窗上的 OK / Allow / Next / Continue / 下一步 / 确认
; 按 F8 暂停/恢复 | 按 F9 退出

#NoEnv
#Persistent
#SingleInstance Force
SetKeyDelay, 50, 50

active := false
toggle() {
  global active
  active := !active
  if (active)
    SetTimer, ClickDialog, 3000
  else
    SetTimer, ClickDialog, Off
  ToolTip, Cursor Auto-Click: % (active ? "ON" : "OFF")
  SetTimer, RemoveToolTip, -1500
}

F8::toggle()
F9::ExitApp

ClickDialog:
  if WinActive("ahk_exe Cursor.exe") || WinActive("ahk_class Chrome_WidgetWin_1") {
    DetectHiddenWindows, On
    
    ; 点掉常见的确认弹窗按钮
    ; 方案1: 按 Enter（适用于焦点在按钮上的弹窗）
    ; 方案2: 按 Ctrl+Enter（适用于 Review/Keep All 弹窗）
    ; 方案3: 鼠标点击特定文字按钮
    
    ; 先试试 Ctrl+Enter (Cursor 的 Review/Keep All)
    Send, ^{Enter}
    Sleep, 200
    
    ; 再试试 Enter (一般的 OK / Confirm 弹窗)
    Send, {Enter}
    Sleep, 200
    
    ; 试试 Escape (用于取消类弹窗，如果误触就回退)
    ; Send, {Escape}
  }
Return

RemoveToolTip:
  ToolTip
Return
