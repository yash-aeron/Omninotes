$exe = "C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\OmniNotes-win32-x64\OmniNotes.exe"
$p = Start-Process -FilePath $exe -ArgumentList "--enable-logging" -WorkingDirectory "C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\OmniNotes-win32-x64" -NoNewWindow -Wait -PassThru
Write-Host "ExitCode: $($p.ExitCode)"
