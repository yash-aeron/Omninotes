(Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'OmniNotes' }).CommandLine
