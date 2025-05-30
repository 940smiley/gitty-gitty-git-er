<#
.SYNOPSIS
    Generates Apple splash screen images for PWA support
.DESCRIPTION
    This script generates all the required Apple splash screen images for iOS devices
    from the existing icon assets. It requires ImageMagick to be installed.
.NOTES
    File Name      : generate-splash-screens.ps1
    Prerequisite   : PowerShell, ImageMagick (install via 'choco install imagemagick')
#>

# Check if ImageMagick is installed
$magick = Get-Command magick -ErrorAction SilentlyContinue
if ($null -eq $magick) {
    Write-Error "ImageMagick is not installed. Please install it using 'choco install imagemagick' or from https://imagemagick.org/script/download.php"
    exit 1
}

# Set working directory to project root
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectRoot = Split-Path -Parent $scriptPath
$publicDir = Join-Path $projectRoot "client\public"
$iconsDir = Join-Path $publicDir "icons"

# Create the icons directory if it doesn't exist
if (-not (Test-Path $iconsDir)) {
    New-Item -ItemType Directory -Path $iconsDir -Force | Out-Null
}

# Ensure we have a source icon to use
$sourceIcon = Join-Path $publicDir "icon.svg"
if (-not (Test-Path $sourceIcon)) {
    Write-Error "Source icon not found at $sourceIcon"
    exit 1
}

# Define the splash screen configurations
$splashScreens = @(
    @{ Width = 2048; Height = 2732; Name = "apple-splash-2048-2732.jpg" }, # iPad Pro 12.9" Portrait
    @{ Width = 2732; Height = 2048; Name = "apple-splash-2732-2048.jpg" }, # iPad Pro 12.9" Landscape
    @{ Width = 1668; Height = 2388; Name = "apple-splash-1668-2388.jpg" }, # iPad Pro 11" Portrait
    @{ Width = 2388; Height = 1668; Name = "apple-splash-2388-1668.jpg" }, # iPad Pro 11" Landscape
    @{ Width = 1536; Height = 2048; Name = "apple-splash-1536-2048.jpg" }, # iPad Air Portrait
    @{ Width = 2048; Height = 1536; Name = "apple-splash-2048-1536.jpg" }, # iPad Air Landscape
    @{ Width = 1668; Height = 2224; Name = "apple-splash-1668-2224.jpg" }, # iPad Pro 10.5" Portrait
    @{ Width = 2224; Height = 1668; Name = "apple-splash-2224-1668.jpg" }, # iPad Pro 10.5" Landscape
    @{ Width = 1620; Height = 2160; Name = "apple-splash-1620-2160.jpg" }, # iPad 10.2" Portrait
    @{ Width = 2160; Height = 1620; Name = "apple-splash-2160-1620.jpg" }, # iPad 10.2" Landscape
    @{ Width = 1284; Height = 2778; Name = "apple-splash-1284-2778.jpg" }, # iPhone 13 Pro Max Portrait
    @{ Width = 2778; Height = 1284; Name = "apple-splash-2778-1284.jpg" }, # iPhone 13 Pro Max Landscape
    @{ Width = 1170; Height = 2532; Name = "apple-splash-1170-2532.jpg" }, # iPhone 13 / 13 Pro Portrait
    @{ Width = 2532; Height = 1170; Name = "apple-splash-2532-1170.jpg" }, # iPhone 13 / 13 Pro Landscape
    @{ Width = 1125; Height = 2436; Name = "apple-splash-1125-2436.jpg" }, # iPhone X/XS Portrait
    @{ Width = 2436; Height = 1125; Name = "apple-splash-2436-1125.jpg" }, # iPhone X/XS Landscape
    @{ Width = 1242; Height = 2688; Name = "apple-splash-1242-2688.jpg" }, # iPhone XS Max Portrait
    @{ Width = 2688; Height = 1242; Name = "apple-splash-2688-1242.jpg" }, # iPhone XS Max Landscape
    @{ Width = 828; Height = 1792; Name = "apple-splash-828-1792.jpg" },   # iPhone XR Portrait
    @{ Width = 1792; Height = 828; Name = "apple-splash-1792-828.jpg" },   # iPhone XR Landscape
    @{ Width = 1242; Height = 2208; Name = "apple-splash-1242-2208.jpg" }, # iPhone 8 Plus Portrait
    @{ Width = 2208; Height = 1242; Name = "apple-splash-2208-1242.jpg" }, # iPhone 8 Plus Landscape
    @{ Width = 750; Height = 1334; Name = "apple-splash-750-1334.jpg" },   # iPhone 8 Portrait
    @{ Width = 1334; Height = 750; Name = "apple-splash-1334-750.jpg" },   # iPhone 8 Landscape
    @{ Width = 640; Height = 1136; Name = "apple-splash-640-1136.jpg" },   # iPhone SE Portrait
    @{ Width = 1136; Height = 640; Name = "apple-splash-1136-640.jpg" }    # iPhone SE Landscape
)

# Create Microsoft tile images for browserconfig.xml
$msTiles = @(
    @{ Size = 70; Name = "mstile-70x70.png" },
    @{ Size = 144; Name = "mstile-144x144.png" },
    @{ Size = 150; Name = "mstile-150x150.png" },
    @{ Size = 310; Name = "mstile-310x310.png" }
)

# Create wide Microsoft tile
$msWide = @{ Width = 310; Height = 150; Name = "mstile-310x150.png" }

# Generate Microsoft tile images (square)
foreach ($tile in $msTiles) {
    $outputPath = Join-Path $iconsDir $tile.Name
    Write-Host "Generating $($tile.Name)..."
    & magick convert $sourceIcon -resize "$($tile.Size)x$($tile.Size)" -background "#2da44e" -flatten $outputPath
}

# Generate Microsoft wide tile
$wideOutputPath = Join-Path $iconsDir $msWide.Name
Write-Host "Generating $($msWide.Name)..."
& magick convert $sourceIcon -resize "$($msWide.Width)x$($msWide.Height)" -background "#2da44e" -gravity center -extent "$($msWide.Width)x$($msWide.Height)" -flatten $wideOutputPath

# Generate all splash screen images
foreach ($screen in $splashScreens) {
    $outputPath = Join-Path $iconsDir $screen.Name
    Write-Host "Generating $($screen.Name)..."
    
    # Create a blank canvas with the specified dimensions and our theme color
    & magick convert -size "$($screen.Width)x$($screen.Height)" canvas:#2da44e $outputPath
    
    # Calculate the size of the icon to place in the center (40% of the shorter dimension)
    $iconSize = [math]::Min($screen.Width, $screen.Height) * 0.4
    
    # Overlay the icon in the center
    & magick composite -gravity center -geometry "$($iconSize)x$($iconSize)" $sourceIcon $outputPath $outputPath
}

Write-Host "Splash screen generation complete. Generated $(($splashScreens.Count) + ($msTiles.Count) + 1) images."
Write-Host "Images are located in: $iconsDir"

