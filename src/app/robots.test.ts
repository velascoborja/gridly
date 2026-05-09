import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./robots.ts", import.meta.url), "utf8");

test("robots exports a default function", () => {
  assert.match(source, /export default function robots/);
});

test("robots disallows api and authenticated paths", () => {
  assert.match(source, /\/api\//);
  assert.match(source, /\/es\/setup\//);
  assert.match(source, /\/en\/setup\//);
  assert.match(source, /\/es\/20/);
  assert.match(source, /\/en\/20/);
});

test("robots points to the sitemap", () => {
  assert.match(source, /sitemap\.xml/);
});

test("robots allows the root path", () => {
  assert.match(source, /allow.*\//);
});
