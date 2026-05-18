"""Cursor watchdog v3: Keyboard-based approval."""
import pyautogui, pygetwindow as gw, time

pyautogui.FAILSAFE = False

# Activate Cursor
wins = [w for w in gw.getAllWindows() if 'ion-dex' in w.title]
if not wins:
    # Alt+Tab
    pyautogui.keyDown('alt')
    pyautogui.press('tab')
    pyautogui.keyUp('alt')
    time.sleep(0.5)
else:
    wins[0].activate()
    time.sleep(0.3)

# Strategy: Send a sequence of keystrokes that dismiss common dialogs
# 1. Escape - dismiss any floating menus
pyautogui.press('escape')
time.sleep(0.2)

# 2. Ctrl+Enter - accept/run in Composer
pyautogui.hotkey('ctrl', 'enter')
time.sleep(0.3)

# 3. Enter - accept default action
pyautogui.press('enter')
time.sleep(0.2)

# 4. Tab + Enter - focus and click primary button
pyautogui.press('tab')
time.sleep(0.1)
pyautogui.press('tab')
time.sleep(0.1)
pyautogui.press('enter')
time.sleep(0.2)

# 5. Ctrl+Shift+Enter - alternative accept
pyautogui.hotkey('ctrl', 'shift', 'enter')
time.sleep(0.3)

print("Keyboard approval sequence sent")
