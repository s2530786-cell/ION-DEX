; CursorAutoWorker.ahk — 全自动派活 + 弹窗处理
; 替代旧 CursorWatchdog.ahk
#Requires AutoHotkey v2.0
#SingleInstance Force

SetTitleMatchMode "RegEx"

global TASK_FILE := "D:\openclaw-tools\ion-dex-nuke\scripts\task-queue.txt"
global PROJECT_DIR := "D:\openclaw-tools\ion-dex-nuke"
global CURSOR_TITLE := "ion-dex-nuke.*Cursor"
global LAST_GIT_HASH := ""
global MIN_CPU_DELTA := 50  ; CPU seconds increase to consider "working"
global CHECK_INTERVAL := 20000  ; 20 seconds
global IDLE_THRESHOLD := 180000  ; 3 minutes of no activity = idle → dispatch

; ── Task Queue ─────────────────────────────────────────────────
TASKS := [
    {name:"Task 2 — FunC Compile Fix", prompt:"Read SESSION_STATE.md. Run: node scripts/compile-func.mjs. Fix all compilation errors one by one. After each fix, recompile. When all 22 contracts compile, git commit and update SESSION_STATE.md. Auto-accept all changes."},
    {name:"Task 3 — Token Contract", prompt:"Read SESSION_STATE.md. Implement contracts/ion/token.fc and contracts/bsc/src/IONtoken.sol per docs/03-technical-architecture.md. Compile both. Fix errors. Git commit. Update SESSION_STATE.md. Auto-accept all."},
    {name:"Task 4 — 100-pass Stress Test", prompt:"Read SESSION_STATE.md. Run scripts/verify-100.ps1. Must pass all 100 iterations clean. If any fail, fix and re-run. Git commit. Update SESSION_STATE.md. Auto-accept all."},
    {name:"Task 5 — CI Update", prompt:"Read SESSION_STATE.md. Update .github/workflows/ci.yml to include FunC compilation + TON tests + Foundry tests. Verify CI passes locally. Git commit. Update SESSION_STATE.md. Auto-accept all."}
]

currentTask := 1

; ── Helpers ────────────────────────────────────────────────────
GetCursorPID() {
    for proc in ComObject("WbemScripting.SWbemLocator").ConnectServer().ExecQuery("SELECT ProcessId,Name FROM Win32_Process WHERE Name='Cursor.exe'") {
        return proc.ProcessId
    }
    return 0
}

GetCursorCPU() {
    static lastTotal := 0
    total := 0
    for proc in ComObject("WbemScripting.SWbemLocator").ConnectServer().ExecQuery("SELECT KernelModeTime,UserModeTime FROM Win32_Process WHERE Name='Cursor.exe'") {
        total += proc.KernelModeTime + proc.UserModeTime
    }
    delta := lastTotal > 0 ? (total - lastTotal) / 10000000 : 0
    lastTotal := total
    return {total: total, delta: delta}
}

ReadGitHash() {
    try {
        SetWorkingDir PROJECT_DIR
        oShell := ComObject("WScript.Shell")
        exec := oShell.Exec('git rev-parse HEAD')
        exec.StdOut.ReadLine()
        return exec.StdOut.ReadLine()
    } catch {
        return ""
    }
}

; ── Dismiss popups ─────────────────────────────────────────────
DismissPopups() {
    ; Check for blocking dialog windows
    try {
        if WinExist("ahk_class #32770",,,) {
            ; "Retry" / "Abort" / "Ignore" / "Keep" / "Cancel" / "OK" dialogs
            ControlClick "Button2", "ahk_class #32770",,,, "NA"  ; Try "Retry"
            ControlClick "Button1", "ahk_class #32770",,,, "NA"  ; Try "OK"
            Sleep 500
        }
    }
    ; Check for Cursor-specific dialogs
    try {
        if WinExist("Cursor ahk_exe Cursor.exe",,,) {
            ControlClick "Button1", "Cursor ahk_exe Cursor.exe",,,, "NA"
            Sleep 500
        }
    }
    ; Alt+F4 on leftover "Cursor" dialogs
    if WinExist("Cursor", "OK") || WinExist("Cursor", "Accept") {
        WinGetPos &wx, &wy, &ww, &wh, "A"
        ControlClick "Button1", "A",,,, "NA"
        Sleep 500
    }
}

; ── Dispatch task to Composer ───────────────────────────────────
DispatchTask(task, taskNum) {
    global CURSOR_TITLE
    
    ; Activate Cursor
    if !WinActivate(CURSOR_TITLE) {
        return false
    }
    WinWaitActive(CURSOR_TITLE,, 3)
    Sleep 1500
    
    ; Open Agent panel
    Send "^+l"
    Sleep 2500
    
    ; Paste task prompt
    A_Clipboard := task.prompt
    Send "^v"
    Sleep 1000
    
    ; Submit (Ctrl+Shift+Enter for agent mode)
    Send "^+{Enter}"
    Sleep 2000
    
    ; Mark task file
    try {
        FileAppend("[" FormatTime(A_Now, "HH:mm:ss") "] Dispatched: " task.name "`n", TASK_FILE)
    }
    
    return true
}

; ── Write next task to SESSION_STATE ───────────────────────────
UpdateSessionState(taskName) {
    stateFile := PROJECT_DIR "\SESSION_STATE.md"
    try {
        state := FileRead(stateFile)
        state := RegExReplace(state, "s)\*\*Current:.*?\*\*", "**Current:** Task " currentTask " — " taskName)
        state := RegExReplace(state, "s)\*\*Status:.*?\*\*", "**Status:** In Progress (auto-dispatched " FormatTime(A_Now, "HH:mm") ")")
        FileDelete stateFile
        FileAppend(state, stateFile)
    }
}

; ── Main Loop ──────────────────────────────────────────────────
Loop {
    Sleep CHECK_INTERVAL
    
    ; Dismiss any popups first
    DismissPopups()
    
    ; Check if Cursor is running
    if !GetCursorPID() {
        FileAppend("[" FormatTime(A_Now, "HH:mm:ss") "] Cursor not running - waiting...`n", TASK_FILE)
        continue
    }
    
    ; Check if work is being done (CPU increase or new git commits)
    cpu := GetCursorCPU()
    gitHash := ReadGitHash()
    
    isWorking := (cpu.delta > MIN_CPU_DELTA) || (gitHash != "" && gitHash != LAST_GIT_HASH)
    
    if gitHash != "" && gitHash != LAST_GIT_HASH {
        FileAppend("[" FormatTime(A_Now, "HH:mm:ss") "] New commit detected: " gitHash "`n", TASK_FILE)
        LAST_GIT_HASH := gitHash
        ; Move to next task
        if currentTask <= TASKS.Length {
            FileAppend("[" FormatTime(A_Now, "HH:mm:ss") "] Task " currentTask " completed!`n", TASK_FILE)
            currentTask++
        }
    }
    
    if !isWorking && currentTask <= TASKS.Length {
        ; Cursor is idle — dispatch next task
        task := TASKS[currentTask]
        FileAppend("[" FormatTime(A_Now, "HH:mm:ss") "] Idle detected (CPU+=" Round(cpu.delta,1) "s). Dispatching: " task.name "`n", TASK_FILE)
        UpdateSessionState(task.name)
        DispatchTask(task, currentTask)
        LAST_GIT_HASH := gitHash
    } else if isWorking {
        ; Working — silently watch
        if cpu.delta > MIN_CPU_DELTA * 5 {
            ; Heavy work, log occasionally
        }
    }
}
