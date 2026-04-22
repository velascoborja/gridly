import test from "node:test";
import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { constants } from "node:fs";

const LOGO_SOURCES = [
  "src/components/layout/app-shell.tsx",
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

test("Gridly wordmark shadow bounds stay inside the SVG viewport", async () => {
  const source = await readSource("public/gridly-wordmark.svg");
  const viewBoxMatch = source.match(/viewBox="([^"]+)"/);
  const filterMatch = source.match(/id="gridly-mark-shadow" x="([^"]+)" y="([^"]+)" width="([^"]+)" height="([^"]+)"/);

  assert.ok(viewBoxMatch, "wordmark should define a viewBox");
  assert.ok(filterMatch, "wordmark should define explicit shadow filter bounds");

  const [, , viewportWidth, viewportHeight] = viewBoxMatch[1].split(/\s+/).map(Number);
  const [, x, y, width, height] = filterMatch.map(Number);

  assert.ok(x >= 0, "shadow filter should not start outside the left viewport edge");
  assert.ok(y >= 0, "shadow filter should not start outside the top viewport edge");
  assert.ok(x + width <= viewportWidth, "shadow filter should not exceed the right viewport edge");
  assert.ok(y + height <= viewportHeight, "shadow filter should not exceed the bottom viewport edge");
});
