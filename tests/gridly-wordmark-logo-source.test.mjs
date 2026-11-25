import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const LOGO_SOURCES = [
  "src/components/layout/base-app-shell.tsx",
  "src/components/landing/public-hero.tsx",
  "src/components/setup/setup-page-client.tsx",
];

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("Gridly brand uses a full wordmark image asset", async () => {
  await access(new URL("../public/gridly-wordmark.svg", import.meta.url), constants.R_OK);

  for (const file of LOGO_SOURCES) {
    const source = await readSource(file);

    assert.match(source, /src="\/gridly-wordmark\.svg"/, `${file} should render the wordmark asset`);
    assert.doesNotMatch(source, /<span[^>]*>\s*Gridly\s*<\/span>/, `${file} should not hardcode Gridly as adjacent logo text`);
    assert.doesNotMatch(source, /src="\/logo\.svg"/, `${file} should not use the icon-only asset for the primary brand`);
  }
});

test("the wordmark uses the same monogram as the app icon", async () => {
  const wordmark = await readSource("public/gridly-wordmark.svg");
  const icon = await readSource("src/app/icon.svg");
  const monogram = icon.match(/<path\b[^>]*\bd="([^"]+)"/)?.[1];

  assert.ok(monogram, "app icon should contain a vector monogram");
  assert.ok(wordmark.includes(`d="${monogram}"`), "wordmark should include the same monogram");
  assert.match(wordmark, /viewBox="0 0 216 64"/, "wordmark should fit the existing header image dimensions");
});
