import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("./json-ld.tsx", import.meta.url), "utf8");

test("JsonLd renders a script tag with application/ld+json type", () => {
  assert.match(source, /application\/ld\+json/);
});

test("JsonLd serializes the schema with JSON.stringify", () => {
  assert.match(source, /JSON\.stringify/);
});

test("JsonLd accepts a schema prop", () => {
  assert.match(source, /schema/);
});
