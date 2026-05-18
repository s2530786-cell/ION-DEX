; CursorWatchdog.ahk - Auto-click approval dialogs in Cursor
; 如按键精灵一样工作：发现按钮 → 点击 → 继续监控

#Requires AutoHotkey v2.0
#SingleInstance Force

SetWorkingDir A_ScriptDir

; ===== CONFIGURATION =====
CheckInterval := 30000  ; 30 seconds between checks
CursorTitle := "ion-dex-nuke"  ; Window title keyword

; ===== BUTTON COLORS TO DETECT =====
; Run button: deep blue #0078D4 -> RGB(0,120,212)
; Keep All button: primary green #28A745 -> RGB(40,167,69)
; Allow dropdown: lighter blue

; ===== MAIN LOOP =====
Loop {
    ; Activate Cursor window
    if WinExist(CursorTitle) {
        WinActivate
        Sleep 500
        
        ; Get Cursor window position
        WinGetPos(&wx, &wy, &ww, &wh, CursorTitle)
        
        ; Composer panel: right ~35% of window
        compLeft := wx + ww * 0.6
        compRight := wx + ww - 5
        compTop := wy + wh * 0.25
        compBottom := wy + wh * 0.85
        
        ; Search for blue Run/Allow buttons in Composer area
        blueFound := PixelSearch(&bx, &by, compLeft, compTop, compRight, compBottom, 0xAB0068, 30)
        ; 0xAB0068 = BGR encoding of RGB(104,0,171)... not quite right
        
        ; Actually use the common VS Code blue: #0078D4 = 0xD47800 in BGR
        blueFound := PixelSearch(&bx, &by, compLeft, compTop, compRight, compBottom, 0xD47800, 40)
        
        if blueFound {
            ToolTip "Found button at " bx "," by " - clicking..."
            MouseClick "left", bx, by
            Sleep 300
            ToolTip
        } else {
            ; Try green Keep All button: #28A745 = 0x45A728 in BGR
            greenFound := PixelSearch(&bx, &by, compLeft, compTop, compRight, compBottom, 0x45A728, 30)
            if greenFound {
                ToolTip "Found green button at " bx "," by " - clicking..."
                MouseClick "left", bx, by
                Sleep 300
                ToolTip
            }
        }
        
        ; As backup: try keyboard shortcuts
        Send "{Escape}"
        Sleep 100
        Send "^+{Enter}"  ; Ctrl+Shift+Enter
        Sleep 100
        Send "^{Enter}"   ; Ctrl+Enter
        Sleep 100
    }
    
    ; Wait for next check
    Sleep CheckInterval
}
