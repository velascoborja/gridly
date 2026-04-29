# Feature: App Icons & Web App Metadata

This document describes how Gridly exposes browser, installable app, and iOS Safari icon assets.

## Overview

Gridly uses Next.js App Router file-based metadata for primary app icons and keeps one conventional root Apple touch icon in `public/` for Safari iOS bookmark and favorites discovery.

## Key Components

- `src/app/favicon.ico`: Root favicon served by Next.js as `/favicon.ico`.
- `src/app/icon.svg`: Scalable app icon used by Next.js file-based metadata.
- `src/app/apple-icon.png`: 180x180 Apple icon used by Next.js file-based metadata and linked as `rel="apple-touch-icon"`.
- `public/apple-touch-icon.png`: Conventional 180x180 root fallback for Safari iOS surfaces that probe `/apple-touch-icon.png` directly.
- `public/icon-192.png` and `public/icon-512.png`: PNG icons referenced by the web app manifest.
- `src/app/manifest.ts`: Web app manifest metadata for installable clients.
- `tests/app-icons-source.test.mjs`: Source-level regression coverage for icon dimensions, manifest references, and the Safari root fallback.

## Implementation Details

Next.js evaluates `favicon.ico`, `icon.*`, and `apple-icon.*` files under `src/app/` and generates the corresponding `<head>` metadata. Layout metadata should not define an `icons` override unless there is a specific reason, because overriding can bypass the file-based metadata convention.

iOS Home Screen installation uses the generated Apple icon metadata correctly. Safari iOS Favorites and Bookmarks can also request conventional root Apple touch icon filenames, so `public/apple-touch-icon.png` must remain present and byte-for-byte aligned with `src/app/apple-icon.png`.

When updating the app icon, replace both Apple PNG files together and run:

```bash
npm test -- tests/app-icons-source.test.mjs
```
