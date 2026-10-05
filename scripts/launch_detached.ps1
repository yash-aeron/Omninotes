$exe = "C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\OmniNotes-win32-x64\OmniNotes.exe"
$dir = "C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\OmniNotes-win32-x64"

$result = Invoke-CimMethod -ClassName Win32_Process -MethodName Create -Arguments @{
    CommandLine = "`"$exe`""
    CurrentDirectory = $dir
}

Write-Host "ReturnValue: $($result.ReturnValue)"
Write-Host "ProcessId: $($result.ProcessId)"
