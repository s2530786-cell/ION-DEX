"""Brute-force find Cursor Run button by known VS Code colors."""
import pyautogui
import time

pyautogui.FAILSAFE = False
screen = pyautogui.screenshot()
w, h = screen.size
pixels = screen.load()

# VS Code button blue: #0078D4 -> RGB(0,120,212)
# And similar shades (tolerance +/-30)
def is_button_blue(r, g, b):
    return (b > 160 and r < 60 and g > 80 and g < 180)

# Also try finding "Run" text color (white text on blue button)
def is_white_text(r, g, b):
    return r > 230 and g > 230 and b > 230

# Scan with 2px step across Composer area
hits = []
step = 2
for y in range(int(h*0.35), int(h*0.75), step):
    for x in range(int(w*0.52), w-5, step):
        r, g, b = pixels[x, y]
        if is_button_blue(r, g, b):
            # Found blue pixel - verify it's a button by checking rectangle
            blue_row = 0
            for dx in range(20):
                try:
                    nr, ng, nb = pixels[x+dx, y]
                    if is_button_blue(nr, ng, nb):
                        blue_row += 1
                except:
                    pass
            if blue_row >= 8:  # At least 8 blue pixels horizontally = button
                hits.append((x, y, blue_row))

if hits:
    # Group nearby hits
    clusters = []
    hits.sort()
    current = []
    for x, y, count in hits:
        if not current:
            current.append((x, y, count))
        elif abs(x - hits[0][0]) < 100 and abs(y - hits[0][1]) < 40:
            current.append((x, y, count))
        else:
            if len(current) >= 3:
                clusters.append(current)
            current = [(x, y, count)]
    if len(current) >= 3:
        clusters.append(current)
    
    if clusters:
        for i, c in enumerate(clusters):
            avg_x = sum(p[0] for p in c) // len(c)
            avg_y = sum(p[1] for p in c) // len(c)
            print(f"Cluster {i}: center=({avg_x},{avg_y}) size={len(c)}")
        # Click the largest cluster (most likely the button)
        best = max(clusters, key=lambda c: len(c))
        click_x = sum(p[0] for p in best) // len(best)
        click_y = sum(p[1] for p in best) // len(best)
        print(f"Clicking cluster center: ({click_x}, {click_y})")
        pyautogui.click(click_x, click_y)
        print("Done!")
    else:
        # Try all hits
        for x, y, _ in set((x, y) for x, y, _ in hits[:5]):
            print(f"  Click hit ({x}, {y})")
            pyautogui.click(x, y)
            time.sleep(0.3)
else:
    print("No blue button found anywhere on screen")
    # Last resort: click common positions
    for px, py in [(1235, 580), (1260, 595), (1285, 605), (1310, 620)]:
        print(f"  Last resort click ({px}, {py})")
        pyautogui.click(px, py)
        time.sleep(0.3)
