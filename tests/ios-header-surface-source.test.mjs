import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("app header exposes a matching iOS status bar surface", async () => {
  const layoutSource = await readSource("src/app/[locale]/layout.tsx");
  const shellSource = await readSource("src/components/layout/app-shell.tsx");
  const statusBarThemeSource = await readSource("src/components/layout/status-bar-theme.tsx");
  const globalsSource = await readSource("src/app/globals.css");

  assert.match(layoutSource, /themeColor:\s*"#f8fafd"/, "Safari should start with tinted browser chrome at the top");
  assert.match(layoutSource, /<StatusBarTheme\s*\/>/, "layout should install the scroll-aware theme-color updater");
  assert.match(layoutSource, /appleWebApp:\s*\{/, "installed iOS app metadata should be configured");
  assert.match(
    layoutSource,
    /statusBarStyle:\s*"black-translucent"/,
    "standalone iOS should allow app content to extend behind the status bar",
  );
  assert.match(shellSource, /className="sticky top-0 z-40 app-header-surface"/, "app shell should use the shared header surface");
  assert.match(statusBarThemeSource, /TOP_THEME_COLOR\s*=\s*"#f8fafd"/, "top-of-page theme color should match the tinted background");
  assert.match(
    statusBarThemeSource,
    /SCROLLED_THEME_COLOR\s*=\s*"#e8edf3"/,
    "scrolled theme color should match the header tint",
  );
  assert.match(statusBarThemeSource, /window\.scrollY\s*>\s*SCROLL_THRESHOLD/, "theme color should depend on scroll position");
  assert.match(statusBarThemeSource, /requestAnimationFrame/, "scroll updates should be animation-frame throttled");
  assert.match(statusBarThemeSource, /addEventListener\("scroll",\s*scheduleThemeColorUpdate,\s*\{\s*passive:\s*true\s*\}\)/);
  assert.match(statusBarThemeSource, /addEventListener\("pageshow"/, "back-forward cache restores should refresh the theme color");
  assert.match(statusBarThemeSource, /meta\[name="theme-color"\]/, "component should update the theme-color meta tag");
  assert.match(globalsSource, /\.app-header-surface\s*\{/, "header surface utility should exist");
  assert.match(globalsSource, /-webkit-backdrop-filter:\s*blur\(20px\)/, "Safari should get prefixed backdrop blur");
  assert.doesNotMatch(
    globalsSource,
    /\.app-header-surface::before/,
    "header CSS should not force a fixed safe-area tint over Safari's scroll-aware chrome",
  );
});
