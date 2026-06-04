import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("HelpFeatureRow is a client component with expand/collapse", () => {
  const source = readFileSync(
    new URL("./help-feature-row.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /"use client"/);
  assert.match(source, /useTranslations\("Help"\)/);
  assert.match(source, /expandLabel/);
  assert.match(source, /collapseLabel/);
  assert.match(source, /useState/);
  assert.match(source, /ChevronDown/);
  assert.match(source, /ChevronUp/);
});
