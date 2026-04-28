import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("app header exposes a matching iOS status bar surface", async () => {
  const layoutSource = await readSource("src/app/[locale]/layout.tsx");
  const shellSource = await readSource("src/components/layout/base-app-shell.tsx");
  const globalsSource = await readSource("src/app/globals.css");

  assert.match(layoutSource, /themeColor:\s*"#ffffff"/, "Safari should start with white browser chrome at the top");
  assert.match(layoutSource, /appleWebApp:\s*\{/, "installed iOS app metadata should be configured");
  assert.match(shellSource, /className="relative md:sticky top-0 z-40 app-header-surface"/, "app shell should use the shared header surface");
  assert.match(globalsSource, /\.app-header-surface\s*\{/, "header surface utility should exist");
  assert.match(globalsSource, /-webkit-backdrop-filter:\s*blur\(20px\)/, "Safari should get prefixed backdrop blur");
});
