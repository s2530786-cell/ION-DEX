"""Activate Cursor and click Run button using pygetwindow + ctypes."""
import pyautogui
import pygetwindow as gw
import time

pyautogui.FAILSAFE = False

# Find Cursor windows
windows = [w for w in gw.getAllWindows() if 'Cursor' in w.title or 'ion-dex' in w.title]
for w in windows:
    print(f"Window: '{w.title}' rect=({w.left},{w.top},{w.width},{w.height})")

if not windows:
    print("No Cursor window found! Listing all visible windows:")
    for w in gw.getAllWindows():
        t = w.title.strip()
        if t and w.width > 200 and w.height > 200:
            print(f"  '{t}' {w.width}x{w.height} at ({w.left},{w.top})")
    # Try Alt+Tab
    pyautogui.keyDown('alt')
    for _ in range(5):
        pyautogui.press('tab')
        time.sleep(0.1)
    pyautogui.keyUp('alt')
    time.sleep(0.5)
    # Re-check
    windows = [w for w in gw.getAllWindows() if 'Cursor' in w.title or 'ion-dex' in w.title]
    
if windows:
    w = max(windows, key=lambda w: w.width * w.height)
    print(f"Activating: '{w.title}'")
    w.activate()
    time.sleep(0.5)
    
# Now take screenshot and analyze
screen = pyautogui.screenshot()
w, h = screen.size
pixels = screen.load()

# Dump full color data for right 50% of screen every 50px
print(f"\nRight half color map (every 50px):")
for y in range(0, h, 50):
    samples = []
    for x in range(int(w*0.5), w, 50):
        r, g, b = pixels[x, y]
        # Classify
        if r > 240 and g > 240 and b > 240:
            c = "W"  # white
        elif r < 30 and g < 30 and b < 30:
            c = "B"  # black
        elif b > 150 and r < 100:
            c = "U"  # blue
        elif r > 200 and g > 200 and b < 100:
            c = "Y"  # yellow
        else:
            c = "."
        samples.append(c)
    print(f"Y={y:4d}: {''.join(samples)}")
