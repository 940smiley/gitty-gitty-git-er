# Commands to Generate Icon Assets

Use these commands to generate all the required PWA icon assets from the SVG files.

## Prerequisites

1. Install the required tools:
   ```
   npm install -g pwa-asset-generator
   ```

## Generate Standard Icons

Generate all standard icons from the base SVG:

```bash
# From the project root directory
cd client/public

# Generate all standard icon sizes
pwa-asset-generator icon.svg icons/ --icon-only --favicon --opaque false --type png --path %PUBLIC_URL%/icons

# This will create:
# - icons/icon-72x72.png
# - icons/icon-96x96.png
# - icons/icon-128x128.png
# - icons/icon-144x144.png
# - icons/icon-152x152.png
# - icons/icon-192x192.png
# - icons/icon-384x384.png
# - icons/icon-512x512.png
# - favicon.ico
# - apple-touch-icon.png
```

## Generate Maskable Icons

Generate all maskable icons from the maskable SVG:

```bash
# From the client/public directory
pwa-asset-generator icon-maskable.svg icons/ --icon-only --type png --path %PUBLIC_URL%/icons --maskable

# Rename the files to match our naming convention
cd icons
for size in 72 96 128 144 152 192 384 512; do
  mv icon-maskable-${size}x${size}.png icon-${size}x${size}-maskable.png
done
```

## Generate Shortcut Icons

Generate the shortcut icons:

```bash
# From the client/public directory
pwa-asset-generator shortcut-repos.svg icons/ --icon-only --type png --path %PUBLIC_URL%/icons --width 192 --height 192
pwa-asset-generator shortcut-ai.svg icons/ --icon-only --type png --path %PUBLIC_URL%/icons --width 192 --height 192

# Rename the files to match our naming convention
cd icons
mv shortcut-repos-192x192.png shortcut-repos.png
mv shortcut-ai-192x192.png shortcut-ai.png
```

## Alternative: Manual Creation

If you prefer to manually create the icons using a design tool:

1. Open the SVG files in a vector editor like Adobe Illustrator, Figma, or Inkscape
2. Export each at the required sizes:
   - 72x72
   - 96x96
   - 128x128
   - 144x144
   - 152x152
   - 192x192
   - 384x384
   - 512x512
3. For maskable icons, ensure the important content is within the inner 80% of the canvas
4. Save to the appropriate locations in the icons directory

## Verify Icons

After generating all icons, verify that they match the paths in the manifest.json file.

