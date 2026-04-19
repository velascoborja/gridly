import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("annual summary source no longer exposes the prefill action", async () => {
  const source = await readSource("src/components/annual/annual-view.tsx");

  assert.doesNotMatch(source, /Rellenar estimaciones/, "annual summary should not render the prefill button label");
  assert.doesNotMatch(source, /handlePrefill/, "annual summary should not define a prefill action handler");
  assert.doesNotMatch(source, /prefill/, "annual summary should not call the prefill endpoint");
});

test("setup source keeps the create-and-prefill onboarding flow", async () => {
  const source = await readSource("src/components/setup/setup-page-client.tsx");

  assert.match(source, /Crear y rellenar estimaciones/, "setup should keep the onboarding CTA");
  assert.match(source, /\/api\/years\/\$\{year\}\/prefill/, "setup should still call the prefill endpoint");
});
