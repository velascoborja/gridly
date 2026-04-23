import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("annual summary keeps the top card as the strongest colored surface", async () => {
  const kpiCards = await readSource("src/components/annual/kpi-cards.tsx");

  assert.match(
    kpiCards,
    /surface-depth-floating[^"]*border-primary\/20[^"]*bg-linear-to-b[^"]*from-primary\/\[0\.08\][^"]*via-card\/98[^"]*to-card\/95/,
    "top card should have the clearest branded tint",
  );
  assert.match(
    kpiCards,
    /<Card className="border-border\/70 bg-card\/92 shadow-sm">/,
    "supporting KPI card should stay mostly neutral",
  );
});
