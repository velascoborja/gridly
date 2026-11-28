import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("bottom sheet stays above the on-screen keyboard and reveals the focused field", () => {
  const source = readFileSync(new URL("./sheet.tsx", import.meta.url), "utf8");

  assert.match(source, /window\.visualViewport/);
  assert.match(source, /window\.innerHeight - viewport\.height - viewport\.offsetTop/);
  assert.match(source, /viewport\.addEventListener\("resize", sync\)/);
  assert.match(source, /ref=\{followVisualViewport\}/);
  assert.match(source, /bottom-\[var\(--sheet-keyboard-inset,0px\)\]/);
  assert.match(source, /max-h-\[calc\(var\(--sheet-viewport-height,100dvh\)\*0\.88\)\]/);
  assert.match(source, /closest<HTMLElement>\('\[data-slot="sheet-body"\]'\)/);
});
