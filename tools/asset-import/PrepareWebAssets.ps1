# Copies real Bjmat WhatsApp photos into the public web folder, builds an import mapping,
# and generates derived catalog crops that hide printed PDF price footers.
# Originals under import/ are never modified.

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
if (-not (Test-Path (Join-Path $root "import"))) {
  $root = "E:\art carreaux ciment\ART"
}

$bejmatSrc = Join-Path $root "import\products\bejmat"
$bejmatDst = Join-Path $root "src\Web\mtart-web\public\images\bjmat"
$homeDst = Join-Path $root "src\Web\mtart-web\public\images\home"
$catalogSrc = Join-Path $root "src\Web\mtart-web\public\images\catalog"
$catalogWeb = Join-Path $catalogSrc "web"
$seedJson = Join-Path $root "src\Services\Catalog\MTArt.Catalog.Infrastructure\SeedData\bejmat-import.json"

New-Item -ItemType Directory -Force -Path $bejmatDst | Out-Null
New-Item -ItemType Directory -Force -Path $catalogWeb | Out-Null
New-Item -ItemType Directory -Force -Path (Split-Path $seedJson) | Out-Null

function Get-ColorFamily([int]$r, [int]$g, [int]$b) {
  $max = [Math]::Max($r, [Math]::Max($g, $b))
  $min = [Math]::Min($r, [Math]::Min($g, $b))
  $l = ($max + $min) / 2.0
  if ($max -eq $min) {
    if ($l -gt 220) { return "White" }
    if ($l -gt 180) { return "Cream" }
    if ($l -lt 40) { return "Black" }
    return "Grey"
  }
  $s = ($max - $min) / (255.0 - [Math]::Abs(2 * $l / 255.0 - 1) * 255.0 + 0.001)
  $h = 0.0
  $delta = $max - $min
  if ($max -eq $r) { $h = 60 * ((($g - $b) / $delta) % 6) }
  elseif ($max -eq $g) { $h = 60 * ((($b - $r) / $delta) + 2) }
  else { $h = 60 * ((($r - $g) / $delta) + 4) }
  if ($h -lt 0) { $h += 360 }

  if ($l -gt 230 -and $s -lt 0.18) { return "White" }
  if ($l -gt 200 -and $s -lt 0.28) { return "Cream" }
  if ($l -lt 38) { return "Black" }
  if ($s -lt 0.12) { return "Grey" }
  if ($h -ge 15 -and $h -lt 45 -and $l -lt 140) { return "Brown" }
  if ($h -ge 20 -and $h -lt 50) { return "Yellow" }
  if ($h -ge 10 -and $h -lt 30) { return "Orange" }
  if ($h -lt 15 -or $h -ge 345) { return "Red" }
  if ($h -ge 300 -and $h -lt 345) { return "Pink" }
  if ($h -ge 260 -and $h -lt 300) { return "Purple" }
  if ($h -ge 170 -and $h -lt 200) { return "Turquoise" }
  if ($h -ge 190 -and $h -lt 260) { return "Blue" }
  if ($h -ge 70 -and $h -lt 170) { return "Green" }
  if ($h -ge 15 -and $h -lt 50) { return "Beige" }
  return "Terracotta"
}

function Get-AverageColor([string]$path) {
  $bmp = [System.Drawing.Bitmap]::FromFile($path)
  try {
    $r = 0L; $g = 0L; $b = 0L; $n = 0L
    $stepX = [Math]::Max(1, [int]($bmp.Width / 40))
    $stepY = [Math]::Max(1, [int]($bmp.Height / 40))
    for ($x = 0; $x -lt $bmp.Width; $x += $stepX) {
      for ($y = 0; $y -lt $bmp.Height; $y += $stepY) {
        $c = $bmp.GetPixel($x, $y)
        $r += $c.R; $g += $c.G; $b += $c.B; $n++
      }
    }
    if ($n -eq 0) { return @{ R = 180; G = 140; B = 100; Hex = "#B48C64"; Family = "Terracotta"; Aspect = 1.0 } }
    $ar = [int]($r / $n); $ag = [int]($g / $n); $ab = [int]($b / $n)
    $hex = "#{0:X2}{1:X2}{2:X2}" -f $ar, $ag, $ab
    $aspect = if ($bmp.Height -eq 0) { 1.0 } else { [double]$bmp.Width / [double]$bmp.Height }
    return @{
      R = $ar; G = $ag; B = $ab; Hex = $hex
      Family = Get-ColorFamily $ar $ag $ab
      Aspect = $aspect
    }
  }
  finally {
    $bmp.Dispose()
  }
}

function Get-ImageType([double]$aspect) {
  if ($aspect -gt 1.28) { return "InstalledProject" }
  if ($aspect -lt 0.78) { return "ProductStack" }
  return "FlatSample"
}

$jpegCodec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq "image/jpeg" }
$encoder = [System.Drawing.Imaging.Encoder]::Quality
$encoderParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
$encoderParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]88)

$files = Get-ChildItem -Path $bejmatSrc -File | Where-Object { $_.Extension -match '\.jpe?g$' } | Sort-Object Name
$images = @()
$index = 1
foreach ($file in $files) {
  $id = "{0:D3}" -f $index
  $webName = "bjmat-$id.jpg"
  $dest = Join-Path $bejmatDst $webName
  Copy-Item -LiteralPath $file.FullName -Destination $dest -Force

  $stats = Get-AverageColor $file.FullName
  $imageType = Get-ImageType $stats.Aspect
  $importId = "BJ-P$id"
  $colorCode = "BJ-C$id"

  $images += [ordered]@{
    originalFileName   = $file.Name
    webFileName        = $webName
    imageUrl           = "/images/bjmat/$webName"
    importId           = $importId
    colorCode          = $colorCode
    detectedColor      = $stats.Family
    detectedFormat     = $null
    suggestedReference = $null
    imageType          = $imageType
    hexApproximation   = $stats.Hex
    needsReview        = $true
    isFeatured         = ($imageType -eq "ProductStack" -and $index -le 12)
  }
  $index++
}

if ($images.Count -gt 0) {
  Copy-Item -LiteralPath (Join-Path $bejmatDst $images[0].webFileName) -Destination (Join-Path $homeDst "bjmat.jpg") -Force
  $hero = $images | Where-Object { $_.imageType -eq "ProductStack" } | Select-Object -First 1
  if ($hero) {
    Copy-Item -LiteralPath (Join-Path $bejmatDst $hero.webFileName) -Destination (Join-Path $homeDst "bjmat-hero.jpg") -Force
  }
}

$payload = [ordered]@{
  sourceFolder = "import/products/bejmat"
  sourceCatalog = "bejmat-whatsapp"
  scannedAt    = [DateTimeOffset]::UtcNow.ToString("o")
  imageCount   = $images.Count
  images       = $images
}

$payload | ConvertTo-Json -Depth 6 | Set-Content -Path $seedJson -Encoding UTF8

$cropped = 0
$catalogFiles = Get-ChildItem -Path $catalogSrc -File | Where-Object { $_.Extension -match '\.jpe?g$' -or $_.Extension -eq ".png" }
foreach ($file in $catalogFiles) {
  $srcBmp = [System.Drawing.Bitmap]::FromFile($file.FullName)
  try {
    $cropH = [Math]::Max(32, [int]($srcBmp.Height * 0.89))
    $rect = New-Object System.Drawing.Rectangle 0, 0, $srcBmp.Width, $cropH
    $croppedBmp = $srcBmp.Clone($rect, $srcBmp.PixelFormat)
    try {
      $outPath = Join-Path $catalogWeb $file.Name
      if ($file.Extension -match '\.png') {
        $croppedBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
      } else {
        $croppedBmp.Save($outPath, $jpegCodec, $encoderParams)
      }
      $cropped++
    }
    finally {
      $croppedBmp.Dispose()
    }
  }
  finally {
    $srcBmp.Dispose()
  }
}

Write-Output "BJMAT_FOUND=$($files.Count)"
Write-Output "BJMAT_COPIED=$($images.Count)"
Write-Output "CATALOG_CROPPED=$cropped"
Write-Output "SEED_JSON=$seedJson"
