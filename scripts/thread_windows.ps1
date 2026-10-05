$pids = (Get-Process -Name 'OmniNotes','electron' -ErrorAction SilentlyContinue).Id
Write-Host "Target PIDs: $($pids -join ', ')"

Add-Type @"
using System;
using System.Text;
using System.Runtime.InteropServices;
public class WinInspector {
    [DllImport("user32.dll")]
    public static extern bool EnumThreadWindows(int dwThreadId, EnumThreadDelegate lpfn, IntPtr lParam);
    public delegate bool EnumThreadDelegate(IntPtr hWnd, IntPtr lParam);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetWindowText(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

    [DllImport("user32.dll", CharSet = CharSet.Auto)]
    public static extern int GetClassName(IntPtr hWnd, StringBuilder lpClassName, int nMaxCount);

    [DllImport("user32.dll")]
    public static extern bool IsWindowVisible(IntPtr hWnd);
}
"@

foreach ($p in (Get-Process -Name 'OmniNotes','electron' -ErrorAction SilentlyContinue)) {
    foreach ($t in $p.Threads) {
        [WinInspector]::EnumThreadWindows($t.Id, {
            param($h, $l)
            $sb = New-Object System.Text.StringBuilder 256
            $sc = New-Object System.Text.StringBuilder 256
            [WinInspector]::GetWindowText($h, $sb, 256) | Out-Null
            [WinInspector]::GetClassName($h, $sc, 256) | Out-Null
            $vis = [WinInspector]::IsWindowVisible($h)
            Write-Host "PID $($p.Id) | HWND: $h | Vis: $vis | Class: $($sc.ToString()) | Title: $($sb.ToString())"
            return $true
        }, [IntPtr]::Zero)
    }
}
