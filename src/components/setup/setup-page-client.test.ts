import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("extra payments toggle uses an animated switch and reveal", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /className="[^"]*sr-only[^"]*"/);
  assert.match(source, /role="switch"/);
  assert.match(source, /transition-\[background-color,box-shadow\]/);
  assert.match(source, /transition-transform/);
  assert.match(source, /translate-x-5/);
  assert.match(source, /transition-\[grid-template-rows,opacity,margin-top\]/);
  assert.match(source, /overflow-hidden px-1 pb-2/);
  assert.match(source, /aria-hidden=\{!hasExtraPayments\}/);
});

test("create year submission refreshes before returning to the selected route", () => {
  const source = readFileSync(new URL("./setup-page-client.tsx", import.meta.url), "utf8");

  assert.match(source, /router\.refresh\(\)/);
  assert.match(source, /router\.push\(redirectTo\)/);
});
