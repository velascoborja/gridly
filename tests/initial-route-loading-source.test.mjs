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
  const logo = source.match(/<Image\b[^>]*gridly-wordmark\.svg[^>]*\/>/)?.[0];
  assert.match(logo, /h-auto/, "the loading wordmark should preserve its intrinsic aspect ratio");
  assert.doesNotMatch(source.slice(0, source.indexOf(logo)), /overflow-hidden/, "the loading wordmark should have no clipping ancestor");
  assert.match(source, /animate-shimmer-slide/);
  assert.match(source, /animate-label-fade/);
  assert.match(source, /role="status"/);
  assert.doesNotMatch(source, /h-1 overflow-hidden/);
  assert.doesNotMatch(source, /w-1\/2 animate-pulse/);
});
