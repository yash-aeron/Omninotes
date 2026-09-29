Get-ChildItem -Path $env:APPDATA -Filter 'omninotes-desktop.log' -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "=== Log file: $($_.FullName) ==="
    Get-Content $_.FullName -Tail 20
}
