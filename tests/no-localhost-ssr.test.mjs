import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const serverPages = [
  "src/app/[year]/overview/page.tsx",
  "src/app/[year]/summary/page.tsx",
  "src/app/[year]/[month]/page.tsx",
];

test("server pages do not self-fetch the local API host", async () => {
  for (const file of serverPages) {
    const source = await readFile(new URL(`../${file}`, import.meta.url), "utf8");

    assert.doesNotMatch(source, /localhost:3000/, `${file} should not depend on a local host fallback`);
    assert.doesNotMatch(source, /NEXT_PUBLIC_BASE_URL/, `${file} should not depend on a public base URL for server data`);
  }
});
