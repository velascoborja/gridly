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

test("opengraph-image.png exists in public/ and is 1200×630", async () => {
  const png = await readBytes("public/opengraph-image.png");
  assert.deepEqual(pngSize(png), { width: 1200, height: 630 });
});

test("cache-busted Open Graph image exists in public/ and is 1200×630", async () => {
  const png = await readBytes("public/opengraph-image-gridly.png");
  assert.deepEqual(pngSize(png), { width: 1200, height: 630 });
});

test("opengraph-image.alt.txt provides descriptive alt text", async () => {
  const alt = await readSource("public/opengraph-image.alt.txt");
  assert.ok(alt.trim().length > 0, "alt text should not be empty");
});

test("layout exports metadataBase for absolute URL resolution", async () => {
  const layout = await readSource("src/app/[locale]/layout.tsx");
  assert.match(layout, /metadataBase/, "layout should export metadataBase");
  assert.match(
    layout,
    /NEXT_PUBLIC_APP_URL/,
    "metadataBase should read from NEXT_PUBLIC_APP_URL env var"
  );
  assert.match(
    layout,
    /VERCEL_PROJECT_PRODUCTION_URL/,
    "metadataBase should support Vercel's production URL env var"
  );
  assert.match(
    layout,
    /https:\/\/appgridly\.com/,
    "metadataBase should fall back to the production domain"
  );
  assert.doesNotMatch(
    layout,
    /localhost:3000/,
    "metadataBase should not fall back to localhost in deployed metadata"
  );
});

test("layout marks HTML with the Open Graph RDFa prefix", async () => {
  const layout = await readSource("src/app/[locale]/layout.tsx");
  assert.match(
    layout,
    /prefix=["']og: https:\/\/ogp\.me\/ns#["']/,
    "html should include the Open Graph RDFa prefix"
  );
});

test("layout exports openGraph metadata for the landing page", async () => {
  const layout = await readSource("src/app/[locale]/layout.tsx");
  assert.match(layout, /openGraph\s*:/, "layout should export openGraph metadata");
  assert.match(
    layout,
    /type\s*:\s*['"]website['"]/,
    "openGraph type should be website"
  );
  assert.match(
    layout,
    /siteName\s*:\s*['"]Gridly['"]/,
    "openGraph siteName should be Gridly"
  );
  assert.match(layout, /secureUrl\s*:/, "openGraph image secure URL should be declared");
  assert.match(layout, /width\s*:\s*1200/, "openGraph image width should be declared");
  assert.match(layout, /height\s*:\s*630/, "openGraph image height should be declared");
  assert.match(layout, /type\s*:\s*['"]image\/png['"]/, "openGraph image type should be declared");
});

test("landing page generateMetadata sets locale-specific openGraph locale", async () => {
  const page = await readSource("src/app/[locale]/page.tsx");
  assert.match(page, /es_ES/, "ES landing page should set openGraph locale to es_ES");
  assert.match(page, /en_US/, "EN landing page should set openGraph locale to en_US");
});

test("layout exports twitter card metadata", async () => {
  const layout = await readSource("src/app/[locale]/layout.tsx");
  assert.match(layout, /twitter\s*:/, "layout should export twitter metadata");
  assert.match(
    layout,
    /card\s*:\s*['"]summary_large_image['"]/,
    "twitter card should be summary_large_image"
  );
  assert.match(
    layout,
    /openGraphImageUrl/,
    "twitter images should reference the og image"
  );
});
