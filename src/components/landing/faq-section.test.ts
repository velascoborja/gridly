import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./faq-section.tsx", import.meta.url), "utf8");

test("FAQSection reads FAQ translations", () => {
  assert.match(source, /useTranslations.*FAQ/);
});

test("FAQSection uses t.raw to access items array", () => {
  assert.match(source, /t\.raw\(["']items["']\)/);
});

test("FAQSection renders details and summary elements", () => {
  assert.match(source, /<details/);
  assert.match(source, /<summary/);
});
