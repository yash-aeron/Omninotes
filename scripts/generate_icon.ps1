Add-Type -AssemblyName System.Drawing

$size = 128
$bmp = New-Object System.Drawing.Bitmap $size, $size
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

# Background: Rounded purple rectangle
$brush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 99, 102, 241)) # Indigo
$g.FillEllipse($brush, 4, 4, 120, 120)

# Stylus / Pen tip in golden yellow
$penBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 245, 158, 11)) # Amber
$points = @(
    New-Object System.Drawing.PointF 64, 24
    New-Object System.Drawing.PointF 88, 70
    New-Object System.Drawing.PointF 74, 96
    New-Object System.Drawing.PointF 64, 88
    New-Object System.Drawing.PointF 54, 96
    New-Object System.Drawing.PointF 40, 70
)
$g.FillPolygon($penBrush, $points)

# Nib center in white
$whiteBrush = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
$nibPoints = @(
    New-Object System.Drawing.PointF 64, 24
    New-Object System.Drawing.PointF 68, 50
    New-Object System.Drawing.PointF 64, 56
    New-Object System.Drawing.PointF 60, 50
)
$g.FillPolygon($whiteBrush, $nibPoints)

$icoPath = "C:\Users\aeron\OneDrive\Documents\notes-app\public\app-icon.ico"
$pngPath = "C:\Users\aeron\OneDrive\Documents\notes-app\public\app-icon.png"

$bmp.Save($pngPath, [System.Drawing.Imaging.ImageFormat]::Png)

# Convert to ICO using Icon.FromHandle
$hIcon = $bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)
$fs = New-Object System.IO.FileStream $icoPath, ([System.IO.FileMode]::Create)
$icon.Save($fs)
$fs.Close()

Write-Host "Created icon files at:"
Write-Host "PNG:" (Test-Path $pngPath)
Write-Host "ICO:" (Test-Path $icoPath)
