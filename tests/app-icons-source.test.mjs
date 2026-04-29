import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function readBytes(path) {
  return readFile(new URL(`../${path}`, import.meta.url));
}

function pngSize(buffer) {
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

test("Next app icon files cover favicon, SVG icon, and Apple touch icon", async () => {
  const favicon = await readBytes("src/app/favicon.ico");
  const icon = await readSource("src/app/icon.svg");
  const appleIcon = await readBytes("src/app/apple-icon.png");
  const conventionalAppleTouchIcon = await readBytes("public/apple-touch-icon.png");

  assert.equal(favicon.readUInt16LE(2), 1, "favicon should be an ICO file");
  assert.equal(favicon.readUInt16LE(4), 1, "favicon should contain at least one icon entry");
  assert.match(icon, /<svg\b/, "icon should be an SVG file");
  assert.deepEqual(pngSize(appleIcon), { width: 180, height: 180 }, "Apple icon should use the standard iOS touch icon size");
  assert.deepEqual(
    pngSize(conventionalAppleTouchIcon),
    { width: 180, height: 180 },
    "root apple-touch-icon fallback should use the standard iOS touch icon size"
  );
  assert.deepEqual(
    conventionalAppleTouchIcon,
    appleIcon,
    "root apple-touch-icon fallback should stay in sync with the Next apple icon"
  );
});

test("manifest uses installable PNG icons and layout does not override file metadata", async () => {
  const manifest = await readSource("src/app/manifest.ts");
  const layout = await readSource("src/app/[locale]/layout.tsx");
  const icon192 = await readBytes("public/icon-192.png");
  const icon512 = await readBytes("public/icon-512.png");

  assert.match(manifest, /src: '\/icon\.svg'/, "manifest should keep an SVG icon for scalable clients");
  assert.match(manifest, /src: '\/icon-192\.png'/, "manifest should include a 192px PNG icon");
  assert.match(manifest, /src: '\/icon-512\.png'/, "manifest should include a 512px PNG icon");
  assert.deepEqual(pngSize(icon192), { width: 192, height: 192 });
  assert.deepEqual(pngSize(icon512), { width: 512, height: 512 });
  assert.doesNotMatch(layout, /\n\s+icons:\s*\{/, "layout should let Next file-based icon metadata generate head links");
});
