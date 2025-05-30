# PWA Icons

This directory contains icons for the Progressive Web App functionality.

## Required Icons

The following icon files need to be created and placed in this directory:

### Standard Icons
- icon-72x72.png
- icon-96x96.png
- icon-128x128.png
- icon-144x144.png
- icon-152x152.png
- icon-192x192.png
- icon-384x384.png
- icon-512x512.png

### Maskable Icons (with safe zone)
- icon-72x72-maskable.png
- icon-96x96-maskable.png
- icon-128x128-maskable.png
- icon-144x144-maskable.png
- icon-152x152-maskable.png
- icon-192x192-maskable.png
- icon-384x384-maskable.png
- icon-512x512-maskable.png

### Shortcut Icons
- shortcut-repos.png (192x192)
- shortcut-ai.png (192x192)

## Guidelines

- Standard icons should have the full icon visible
- Maskable icons should have a safe zone - keep important content within the inner 80% of the canvas
- Use the GitHub green color (#2da44e) as the primary brand color
- Use PNG format with transparency
- Follow Material Design guidelines for icon design

## Generation Tools

You can generate these icons using:
- [PWA Asset Generator](https://github.com/onderceylan/pwa-asset-generator)
- [Maskable.app Editor](https://maskable.app/editor)
- Adobe Illustrator, Figma, or other design tools

Example command with PWA Asset Generator:
```
npx pwa-asset-generator logo.svg ./icons -i ./index.html -m ./manifest.json
```

