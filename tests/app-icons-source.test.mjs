import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";

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

function rgbaPng(buffer) {
  const signature = buffer.subarray(0, 8).toString("hex");
  assert.equal(signature, "89504e470d0a1a0a", "file should be a PNG");

  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const chunks = [];

  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    offset += 4;
    const type = buffer.toString("ascii", offset, offset + 4);
    offset += 4;
    const data = buffer.subarray(offset, offset + length);
    offset += length + 4;

    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === "IDAT") {
      chunks.push(data);
    } else if (type === "IEND") {
      break;
    }
  }

  assert.equal(bitDepth, 8, "icon PNGs should use 8-bit channels");
  assert.equal(colorType, 6, "icon PNGs should use RGBA pixels");

  const raw = inflateSync(Buffer.concat(chunks));
  const bytesPerPixel = 4;
  const stride = width * bytesPerPixel;
  const pixels = Buffer.alloc(height * stride);
  let sourceOffset = 0;

  for (let y = 0; y < height; y += 1) {
    const filter = raw[sourceOffset];
    sourceOffset += 1;
    const row = raw.subarray(sourceOffset, sourceOffset + stride);
    sourceOffset += stride;
    const outputRow = pixels.subarray(y * stride, (y + 1) * stride);

    for (let x = 0; x < stride; x += 1) {
      const left = x >= bytesPerPixel ? outputRow[x - bytesPerPixel] : 0;
      const above = y > 0 ? pixels[(y - 1) * stride + x] : 0;
      const upperLeft = y > 0 && x >= bytesPerPixel ? pixels[(y - 1) * stride + x - bytesPerPixel] : 0;
      let value = row[x];

      if (filter === 1) {
        value += left;
      } else if (filter === 2) {
        value += above;
      } else if (filter === 3) {
        value += Math.floor((left + above) / 2);
      } else if (filter === 4) {
        const estimate = left + above - upperLeft;
        const leftDistance = Math.abs(estimate - left);
        const aboveDistance = Math.abs(estimate - above);
        const upperLeftDistance = Math.abs(estimate - upperLeft);
        value += leftDistance <= aboveDistance && leftDistance <= upperLeftDistance ? left : aboveDistance <= upperLeftDistance ? above : upperLeft;
      } else {
        assert.equal(filter, 0, "PNG filter should be valid");
      }

      outputRow[x] = value & 255;
    }
  }

  return { width, height, pixels };
}

function alphaBounds(buffer, minimumAlpha) {
  const { width, height, pixels } = rgbaPng(buffer);
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (pixels[(y * width + x) * 4 + 3] >= minimumAlpha) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  return {
    width: maxX >= minX ? maxX - minX + 1 : 0,
    height: maxY >= minY ? maxY - minY + 1 : 0,
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
  assert.deepEqual(
    alphaBounds(appleIcon, 240),
    { width: 180, height: 180 },
    "Apple icon should fill its canvas without baked-in transparent padding"
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
