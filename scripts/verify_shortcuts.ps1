$w = New-Object -ComObject WScript.Shell
$s1 = $w.CreateShortcut("C:\Users\aeron\AppData\Roaming\Microsoft\Windows\Start Menu\Programs\OmniNotes.lnk")
Write-Host "Start Menu Target: " $s1.TargetPath
Write-Host "Start Menu WorkingDir: " $s1.WorkingDirectory

$s2 = $w.CreateShortcut("C:\Users\aeron\OneDrive\Desktop\OmniNotes.lnk")
Write-Host "Desktop Target: " $s2.TargetPath
Write-Host "Desktop WorkingDir: " $s2.WorkingDirectory
