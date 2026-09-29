Get-CimInstance Win32_Process | Where-Object { $_.Name -match 'OmniNotes|electron' } | Select-Object ProcessId, Name, CommandLine | Format-Table -AutoSize
