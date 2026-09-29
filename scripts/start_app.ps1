$p = [System.Diagnostics.Process]::Start("C:\Users\aeron\OneDrive\Documents\notes-app\dist-desktop\OmniNotes-win32-x64\OmniNotes.exe")
Write-Host "Started process ID:" $p.Id
