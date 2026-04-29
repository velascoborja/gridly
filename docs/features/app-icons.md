# Feature: App Icons & Web App Metadata

This document describes how Gridly exposes browser, installable app, and iOS Safari icon assets.

## Overview

Gridly uses Next.js App Router file-based metadata for primary app icons and keeps one conventional root Apple touch icon in `public/` for Safari iOS bookmark and favorites discovery. Browser and installable metadata icons are intentionally edge-to-edge, because browser tabs, bookmark bars, and Safari iOS add their own visual containers.

## Key Components

- `src/app/favicon.ico`: Root favicon served by Next.js as `/favicon.ico`. This is a browser metadata asset and should not include baked-in transparent padding.
- `src/app/icon.svg`: Scalable app icon used by Next.js file-based metadata. The SVG viewBox is cropped to the visible mark so browser tabs do not render a shrunken icon.
- `src/app/apple-icon.png`: 180x180 Apple icon used by Next.js file-based metadata and linked as `rel="apple-touch-icon"`. This asset should not include baked-in transparent padding.
- `public/apple-touch-icon.png`: Conventional 180x180 root fallback for Safari iOS surfaces that probe `/apple-touch-icon.png` directly. Keep it in sync with `src/app/apple-icon.png`.
- `public/icon.svg`, `public/icon-192.png`, and `public/icon-512.png`: Manifest icons referenced by `src/app/manifest.ts`. These are metadata assets and should stay visually tight.
- `src/app/manifest.ts`: Web app manifest metadata for installable clients.
- `tests/app-icons-source.test.mjs`: Source-level regression coverage for icon dimensions, manifest references, and the Safari root fallback.

## Implementation Details

Next.js evaluates `favicon.ico`, `icon.*`, and `apple-icon.*` files under `src/app/` and generates the corresponding `<head>` metadata. Layout metadata should not define an `icons` override unless there is a specific reason, because overriding can bypass the file-based metadata convention.

iOS Home Screen installation uses the generated Apple icon metadata correctly. Safari iOS Favorites and Bookmarks can also request conventional root Apple touch icon filenames, so `public/apple-touch-icon.png` must remain present and byte-for-byte aligned with `src/app/apple-icon.png`.

Browser tabs, bookmark previews, and Safari iOS bookmark previews already render icons inside their own constrained surfaces. If a metadata icon includes transparent padding or a large shadow around the artwork, the visible mark appears too small. The regression test checks that high-opacity pixels fill the full bitmap canvas and that the SVG metadata icons use the cropped viewBox.

When updating the app icon, replace both Apple PNG files together and run:

```bash
npm test -- tests/app-icons-source.test.mjs
```
