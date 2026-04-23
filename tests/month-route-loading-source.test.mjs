import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("month route exposes a loading shell for client navigation", async () => {
  const source = await readSource("src/app/[locale]/[year]/[month]/loading.tsx");

  assert.match(source, /AppShell/, "month route loading UI should preserve the app shell during navigation");
  assert.match(source, /animate-pulse/, "month route loading UI should visibly acknowledge the pending transition");
  assert.match(source, /MonthlyLoading/, "month route loading UI should export a dedicated loading component");
});
