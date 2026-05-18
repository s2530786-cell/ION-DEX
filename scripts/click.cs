using System;
using System.Runtime.InteropServices;
using System.Threading;

class ClickButton {
    [DllImport("user32.dll")] static extern bool SetCursorPos(int X, int Y);
    [DllImport("user32.dll")] static extern void mouse_event(uint dwFlags, uint dx, uint dy, uint dwData, UIntPtr dwExtraInfo);

    const uint MOUSEEVENTF_LEFTDOWN = 0x0002;
    const uint MOUSEEVENTF_LEFTUP = 0x0004;

    static void Click() {
        mouse_event(MOUSEEVENTF_LEFTDOWN, 0, 0, 0, UIntPtr.Zero);
        Thread.Sleep(50);
        mouse_event(MOUSEEVENTF_LEFTUP, 0, 0, 0, UIntPtr.Zero);
    }

    static void Main(string[] args) {
        int x = 1550, y = 995;
        if (args.Length >= 2) {
            int.TryParse(args[0], out x);
            int.TryParse(args[1], out y);
        }
        Console.WriteLine("Clicking at {0},{1}", x, y);
        SetCursorPos(x, y);
        Thread.Sleep(100);
        Click();
        Console.WriteLine("Done");
    }
}
