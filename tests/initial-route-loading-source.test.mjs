import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("localized app entry exposes a branded loading shell for first open", async () => {
  const source = await readSource("src/app/[locale]/loading.tsx");

  assert.match(source, /Preparando Gridly/);
  assert.match(source, /gridly-wordmark\.svg/);
  assert.match(source, /animate-spin/);
  assert.match(source, /role="status"/);
  assert.doesNotMatch(source, /h-1 overflow-hidden/);
  assert.doesNotMatch(source, /w-1\/2 animate-pulse/);
});
