import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("ownership helper defines guarded resource lookups", async () => {
  const source = await readSource("src/lib/server/ownership.ts");

  assert.match(source, /getOwnedYear/);
  assert.match(source, /getOwnedMonth/);
  assert.match(source, /getOwnedEntry/);
  assert.match(source, /statusForAuth/);
});

test("legacy owner email is fixed to the approved account", async () => {
  const source = await readSource("src/lib/server/legacy-user.ts");

  assert.match(source, /LEGACY_OWNER_EMAIL/);
  assert.match(source, /velascoborja@gmail\.com/);
});
