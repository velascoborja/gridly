import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("bottom sheet stays anchored under the on-screen keyboard and scrolls the focused field above it", () => {
  const source = readFileSync(new URL("./sheet.tsx", import.meta.url), "utf8");

  assert.match(source, /window\.visualViewport/);
  assert.match(source, /sheetBottom - \(viewport\.offsetTop \+ viewport\.height\)/);
  assert.match(source, /viewport\.addEventListener\("resize", sync\)/);
  assert.match(source, /ref=\{followVisualViewport\}/);
  assert.match(source, /fixed inset-x-0 bottom-0 z-50 flex max-h-\[88dvh\]/);
  assert.match(source, /pb-\[calc\(max\(1rem,env\(safe-area-inset-bottom\)\)\+var\(--sheet-keyboard-inset,0px\)\)\]/);
  assert.doesNotMatch(source, /bottom-\[var\(--sheet-keyboard-inset/);
  assert.match(source, /closest<HTMLElement>\('\[data-slot="sheet-body"\]'\)/);
});
