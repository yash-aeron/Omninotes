Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinFinder {
    [DllImport("user32.dll")]
    public static extern bool EnumWindows(EnumWindowsProc lpEnumFunc, IntPtr lParam);
    public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", SetLastError = true, CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@

[WinFinder]::EnumWindows( {
    param($hwnd, $lparam)
    $sbText = New-Object System.Text.StringBuilder 512
    $sbClass = New-Object System.Text.StringBuilder 512
    [WinFinder]::GetWindowText($hwnd, $sbText, 512) | Out-Null
    [WinFinder]::GetClassName($hwnd, $sbClass, 512) | Out-Null
    $pidOut = 0
    [WinFinder]::GetWindowThreadProcessId($hwnd, [ref]$pidOut)
    $visible = [WinFinder]::IsWindowVisible($hwnd)

    $title = $sbText.ToString()
    $class = $sbClass.ToString()

    if ($title -match "OmniNotes|notes|Stylus" -or $pidOut -in @(7808, 17024, 8524, 9624, 2692, 16416, 22196, 23216)) {
        Write-Host "HWND: $hwnd | PID: $pidOut | Visible: $visible | Class: $class | Title: $title"
    }
    return $true
}, [IntPtr]::Zero)
