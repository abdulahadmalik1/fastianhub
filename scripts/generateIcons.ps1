Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path $PSScriptRoot "..\oldlogo.png"
if (-not (Test-Path $srcPath)) {
    $srcPath = Join-Path $PSScriptRoot "..\logo.png"
}
if (-not (Test-Path $srcPath)) {
    $srcPath = Join-Path $PSScriptRoot "..\public\oldlogo.png"
}
if (-not (Test-Path $srcPath)) {
    Write-Error "Source oldlogo.png not found"
    exit 1
}

$publicDir = Join-Path $PSScriptRoot "..\public"
$appDir = Join-Path $PSScriptRoot "..\app"

if (-not (Test-Path $publicDir)) {
    New-Item -ItemType Directory -Path $publicDir -Force | Out-Null
}

$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$w = $bmp.Width
$h = $bmp.Height

Write-Host "Scanning bounds on image: ${w}x${h}..."

$minX = $w
$minY = $h
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $h; $y += 2) {
    for ($x = 0; $x -lt $w; $x += 2) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.A -gt 15) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Bounding box found: minX=$minX, minY=$minY, maxX=$maxX, maxY=$maxY"

$boxW = $maxX - $minX
$boxH = $maxY - $minY
$centerX = $minX + ($boxW / 2.0)
$centerY = $minY + ($boxH / 2.0)

# Square crop with 8% padding
$maxDim = [Math]::Max($boxW, $boxH)
$cropSize = $maxDim * 1.08

$srcCropX = [Math]::Max(0, [int]($centerX - ($cropSize / 2.0)))
$srcCropY = [Math]::Max(0, [int]($centerY - ($cropSize / 2.0)))
$srcCropW = [Math]::Min($w - $srcCropX, [int]$cropSize)
$srcCropH = [Math]::Min($h - $srcCropY, [int]$cropSize)

$finalCropDim = [Math]::Min($srcCropW, $srcCropH)

Write-Host "Cropping square region: X=$srcCropX, Y=$srcCropY, Dim=$finalCropDim"

function Save-ResizedImage {
    param(
        [System.Drawing.Bitmap]$sourceBmp,
        [int]$cropX,
        [int]$cropY,
        [int]$cropDim,
        [int]$targetWidth,
        [int]$targetHeight,
        [string]$outputPath,
        [System.Drawing.Imaging.ImageFormat]$format
    )

    $destBmp = New-Object System.Drawing.Bitmap($targetWidth, $targetHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($destBmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)

    $srcRect = New-Object System.Drawing.Rectangle($cropX, $cropY, $cropDim, $cropDim)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $targetWidth, $targetHeight)

    $g.DrawImage($sourceBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    if (Test-Path $outputPath) { Remove-Item $outputPath -Force }
    $destBmp.Save($outputPath, $format)
    $destBmp.Dispose()
    Write-Host "Created: $outputPath (${targetWidth}x${targetHeight})"
}

# 1. Main public logo (512x512)
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 512 512 (Join-Path $publicDir "logo.png") ([System.Drawing.Imaging.ImageFormat]::Png)

# 2. Favicons
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 16 16 (Join-Path $publicDir "favicon-16x16.png") ([System.Drawing.Imaging.ImageFormat]::Png)
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 32 32 (Join-Path $publicDir "favicon-32x32.png") ([System.Drawing.Imaging.ImageFormat]::Png)
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 48 48 (Join-Path $publicDir "favicon-48x48.png") ([System.Drawing.Imaging.ImageFormat]::Png)

# 3. Apple Touch Icon & Android Chrome icons
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 180 180 (Join-Path $publicDir "apple-touch-icon.png") ([System.Drawing.Imaging.ImageFormat]::Png)
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 192 192 (Join-Path $publicDir "android-chrome-192x192.png") ([System.Drawing.Imaging.ImageFormat]::Png)
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 512 512 (Join-Path $publicDir "android-chrome-512x512.png") ([System.Drawing.Imaging.ImageFormat]::Png)

# 4. Next.js App Router icons
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 32 32 (Join-Path $appDir "icon.png") ([System.Drawing.Imaging.ImageFormat]::Png)
Save-ResizedImage $bmp $srcCropX $srcCropY $finalCropDim 180 180 (Join-Path $appDir "apple-icon.png") ([System.Drawing.Imaging.ImageFormat]::Png)

# 5. Native .ico creation
$ico32Bmp = New-Object System.Drawing.Bitmap(32, 32, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gIco = [System.Drawing.Graphics]::FromImage($ico32Bmp)
$gIco.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$gIco.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gIco.DrawImage($bmp, (New-Object System.Drawing.Rectangle(0, 0, 32, 32)), (New-Object System.Drawing.Rectangle($srcCropX, $srcCropY, $finalCropDim, $finalCropDim)), [System.Drawing.GraphicsUnit]::Pixel)
$gIco.Dispose()

$hIcon = $ico32Bmp.GetHicon()
$icon = [System.Drawing.Icon]::FromHandle($hIcon)

$pubIco = Join-Path $publicDir "favicon.ico"
if (Test-Path $pubIco) { Remove-Item $pubIco -Force }
$fsPub = [System.IO.File]::OpenWrite($pubIco)
$icon.Save($fsPub)
$fsPub.Close()

$appIco = Join-Path $appDir "favicon.ico"
if (Test-Path $appIco) { Remove-Item $appIco -Force }
$fsApp = [System.IO.File]::OpenWrite($appIco)
$icon.Save($fsApp)
$fsApp.Close()

$icon.Dispose()
$ico32Bmp.Dispose()
Write-Host "Created: public/favicon.ico and app/favicon.ico"

# 6. Dispose original and shift to public/oldlogo.png
$bmp.Dispose()

$rootOldLogo = Join-Path $PSScriptRoot "..\oldlogo.png"
if (Test-Path $rootOldLogo) {
    Copy-Item -Path $rootOldLogo -Destination (Join-Path $publicDir "oldlogo.png") -Force
    Remove-Item -Path $rootOldLogo -Force
}
$rootLogo = Join-Path $PSScriptRoot "..\logo.png"
if (Test-Path $rootLogo) {
    Remove-Item -Path $rootLogo -Force
}
Write-Host "Shifted oldlogo.png to public/oldlogo.png and cleaned root"
