$exePath = "C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\Omninotes-win32-x64\Omninotes.exe"
$workingDir = "C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\Omninotes-win32-x64"
$icoDst = "C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\Omninotes-win32-x64\app-icon.ico"
$icoSrc = "C:\Users\aeron\OneDrive\Documents\notes-app\public\app-icon.ico"

Copy-Item -Path $icoSrc -Destination $icoDst -Force -ErrorAction SilentlyContinue

$wscript = New-Object -ComObject WScript.Shell
$programsDir = [Environment]::GetFolderPath('Programs')

# Remove old camelCase shortcuts if present
Remove-Item -Path "$programsDir\OmniNotes.lnk" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "C:\Users\aeron\OneDrive\Desktop\OmniNotes.lnk" -Force -ErrorAction SilentlyContinue

# 1. Create Start Menu Shortcut (named Omninotes)
$startMenuShortcut = Join-Path $programsDir "Omninotes.lnk"
Write-Host "Creating Start Menu shortcut at: $startMenuShortcut"
$shortcut1 = $wscript.CreateShortcut($startMenuShortcut)
$shortcut1.TargetPath = $exePath
$shortcut1.WorkingDirectory = $workingDir
$shortcut1.Description = "Omninotes"
$shortcut1.IconLocation = "$exePath,0"
$shortcut1.Save()

# 2. Create Desktop Shortcut (named Omninotes)
$desktopDirs = @(
    'C:\Users\aeron\OneDrive\Desktop',
    [Environment]::GetFolderPath('Desktop')
) | Select-Object -Unique

foreach ($dir in $desktopDirs) {
    if (Test-Path $dir) {
        $desktopShortcut = Join-Path $dir "Omninotes.lnk"
        Write-Host "Creating Desktop shortcut at: $desktopShortcut"
        $shortcut2 = $wscript.CreateShortcut($desktopShortcut)
        $shortcut2.TargetPath = $exePath
        $shortcut2.WorkingDirectory = $workingDir
        $shortcut2.Description = "Omninotes"
        $shortcut2.IconLocation = "$exePath,0"
        $shortcut2.Save()
    }
}

Write-Host "Shortcuts verified. Launching Omninotes detached..."

# 3. Launch detached via WMI so it stays alive outside agent job object
$res = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = "`"$exePath`""
    CurrentDirectory = $workingDir
}

Write-Host "Launched Omninotes with PID: $($res.ProcessId)"
