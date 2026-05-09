import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./sitemap.ts", import.meta.url), "utf8");

test("sitemap exports a default function", () => {
  assert.match(source, /export default function sitemap/);
});

test("sitemap includes landing pages for both locales at priority 1.0", () => {
  assert.match(source, /\/es/);
  assert.match(source, /\/en/);
  assert.match(source, /priority: 1\.0/);
});

test("sitemap includes legal pages at priority 0.3", () => {
  assert.match(source, /privacy/);
  assert.match(source, /terms/);
  assert.match(source, /priority: 0\.3/);
});

test("sitemap uses NEXT_PUBLIC_APP_URL env variable", () => {
  assert.match(source, /NEXT_PUBLIC_APP_URL/);
});
