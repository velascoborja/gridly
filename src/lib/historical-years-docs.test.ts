import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("feature docs describe historical year import limitations", () => {
  const agents = readFileSync(new URL("../../AGENTS.md", import.meta.url), "utf8");
  const docs = readFileSync(new URL("../../docs/features/historical-year-imports.md", import.meta.url), "utf8");
  const evolutionDocs = readFileSync(new URL("../../docs/features/evolution-dashboard.md", import.meta.url), "utf8");

  assert.match(agents, /docs\/features\/historical-year-imports\.md/);
  assert.match(docs, /summary-only historical imports/);
  assert.match(docs, /before the earliest full Gridly year/);
  assert.match(docs, /do not create months/);
  assert.match(evolutionDocs, /historical imports/);
});
