import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

const filesToCheck = [
  "src/components/layout/app-shell.tsx",
  "src/components/landing/public-hero.tsx",
  "src/components/demo/public-demo-shell.tsx",
  "src/components/setup/setup-page-client.tsx",
];

test("DEV indicator source verification", async (t) => {
  for (const file of filesToCheck) {
    await t.test(`checking ${file}`, async () => {
      const source = await readSource(file);

      assert.match(
        source,
        /process\.env\.NODE_ENV === "development"/,
        `File ${file} should contain: process.env.NODE_ENV === "development"`
      );
      assert.match(
        source,
        /<Badge/,
        `File ${file} should contain: <Badge`
      );

      // Use regex to handle potential whitespace between tags
      assert.match(
        source,
        /<Badge[^>]*>[\s\S]*?DEV[\s\S]*?<\/Badge>/,
        `File ${file} should contain: >DEV</Badge> (with flexible whitespace)`
      );
    });
  }
});
