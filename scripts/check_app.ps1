$programs = [Environment]::GetFolderPath('Programs')
$desktop = [Environment]::GetFolderPath('Desktop')
$oneDriveDesktop = 'C:\Users\aeron\OneDrive\Desktop'

Write-Host "=== Paths ==="
Write-Host "Programs: $programs"
Write-Host "Desktop: $desktop"
Write-Host "OneDrive Desktop: $oneDriveDesktop"

Write-Host "`n=== Shortcuts ==="
Write-Host "Desktop shortcut exists:" (Test-Path "$oneDriveDesktop\OmniNotes.lnk")
Write-Host "Programs shortcut exists:" (Test-Path "$programs\OmniNotes.lnk")

Write-Host "`n=== Running OmniNotes / Electron ==="
Get-Process | Where-Object { $_.ProcessName -match 'OmniNotes|electron' } | Select-Object Id, ProcessName, MainWindowTitle, MainWindowHandle
