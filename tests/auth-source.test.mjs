import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("auth integration exports Auth.js entrypoints", async () => {
  const source = await readSource("src/auth.ts");

  assert.match(source, /NextAuth/);
  assert.match(source, /Google/);
  assert.match(source, /handlers/);
  assert.match(source, /auth/);
  assert.match(source, /signIn/);
  assert.match(source, /signOut/);
  assert.match(source, /claimLegacyYearsForUser/);
});

test("year data helper exposes default-year selection", async () => {
  const source = await readSource("src/lib/server/year-data.ts");

  assert.match(source, /pickDefaultYear/);
  assert.match(source, /getAppRedirectPath/);
});
