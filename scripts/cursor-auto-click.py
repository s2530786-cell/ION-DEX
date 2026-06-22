"""
Cursor 自动点确认后台脚本
每 2 秒扫描一次 Cursor 窗口，自动按 Ctrl+Enter / Enter 消除弹窗
按 F1 在控制台查看状态
用途：防止 Cursor 弹窗卡住要人点下一步
"""

import time
import threading
import ctypes
import sys

# Windows API 常量
WM_KEYDOWN = 0x0100
WM_KEYUP = 0x0101
VK_RETURN = 0x0D
VK_ESCAPE = 0x1B
VK_LCONTROL = 0xA2
KEYEVENTF_KEYUP = 0x0002

user32 = ctypes.windll.user32

def find_cursor_window():
    """查找 Cursor 窗口句柄"""
    hwnd = user32.FindWindowW(None, None)
    while hwnd:
        length = user32.GetWindowTextLengthW(hwnd)
        if length > 0:
            buff = ctypes.create_unicode_buffer(length + 1)
            user32.GetWindowTextW(hwnd, buff, length + 1)
            title = buff.value
            # Cursor 窗口标题通常包含 "Cursor" 或项目名
            if "cursor" in title.lower() or "ion-dex" in title.lower():
                return hwnd
        hwnd = user32.GetWindow(hwnd, 2)  # GW_HWNDNEXT
    return None

def send_enter(hwnd):
    """向窗口发送 Ctrl+Enter 和 Enter"""
    # Ctrl+Enter
    user32.PostMessageW(hwnd, WM_KEYDOWN, VK_LCONTROL, 0)
    time.sleep(0.05)
    user32.PostMessageW(hwnd, WM_KEYDOWN, VK_RETURN, 0)
    time.sleep(0.05)
    user32.PostMessageW(hwnd, WM_KEYUP, VK_RETURN, 0)
    time.sleep(0.05)
    user32.PostMessageW(hwnd, WM_KEYUP, VK_LCONTROL, 0)
    time.sleep(0.1)
    # Enter (单独按)
    user32.PostMessageW(hwnd, WM_KEYDOWN, VK_RETURN, 0)
    time.sleep(0.05)
    user32.PostMessageW(hwnd, WM_KEYUP, VK_RETURN, 0)

def click_loop():
    clicks = 0
    while True:
        try:
            hwnd = find_cursor_window()
            if hwnd and user32.IsWindowVisible(hwnd):
                # 检查窗口是否在前台 (有弹窗时通常前台是 Cursor)
                foreground = user32.GetForegroundWindow()
                if foreground == hwnd:
                    send_enter(hwnd)
                    clicks += 1
                    if clicks % 10 == 0:
                        print(f"[Cursor-Auto] Sent {clicks} clicks (active)")
            time.sleep(2)
        except Exception as e:
            print(f"[Cursor-Auto] Error: {e}")
            time.sleep(5)

def listen_key():
    """监听 F1 键打印状态"""
    import msvcrt
    while True:
        if msvcrt.kbhit():
            key = ord(msvcrt.getch())
            if key == 59:  # F1
                hwnd = find_cursor_window()
                print(f"[Cursor-Auto] Status: Cursor window {'FOUND' if hwnd else 'NOT FOUND'}")

if __name__ == "__main__":
    print("=" * 50)
    print("Cursor Auto-Click 后台脚本已启动")
    print("自动每 2 秒给 Cursor 窗口发 Ctrl+Enter + Enter")
    print("按 F1 查看状态 | Ctrl+C 退出")
    print("=" * 50)
    
    t = threading.Thread(target=listen_key, daemon=True)
    t.start()
    
    try:
        click_loop()
    except KeyboardInterrupt:
        print("[Cursor-Auto] Stopped by user")
        sys.exit(0)
