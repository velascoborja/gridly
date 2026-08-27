import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("month route exposes a loading shell for client navigation", async () => {
  const [source, clientSource, loadingSource] = await Promise.all([
    readSource("src/app/[locale]/[year]/[month]/loading.tsx"),
    readSource("src/components/year/year-page-client.tsx"),
    readSource("src/components/year/year-view-loading.tsx"),
  ]);

  assert.match(source, /AppShell/, "month route loading UI should preserve the app shell during navigation");
  assert.match(source, /<YearViewLoading view="overview" \/>/, "direct month loads should use the shared skeleton");
  assert.match(clientSource, /loading: \(\) => <YearViewLoading view="overview" \/>/, "deferred month loads should use the shared skeleton");
  assert.match(loadingSource, /data-slot=skeleton/, "the shared loading UI should visibly acknowledge the pending transition");
  assert.match(loadingSource, /grid gap-4 lg:grid-cols-2/, "the skeleton should mirror the two resting entry cards");
  assert.match(source, /MonthlyLoading/, "month route loading UI should export a dedicated loading component");
});
