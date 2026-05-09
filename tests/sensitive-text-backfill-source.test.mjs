import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("backfill script loads env, updates protected tables, and avoids printing plaintext", async () => {
  const source = await readSource("scripts/backfill-sensitive-text-encryption.mjs");

  assert.match(source, /loadEnvConfig\(process\.cwd\(\)\)/);
  assert.match(source, /SELECT id, email, name, image, email_hash FROM users/);
  assert.match(source, /UPDATE users/);
  assert.match(source, /additional_entries/);
  assert.match(source, /year_recurring_expenses/);
  assert.match(source, /monthly_recurring_expenses/);
  assert.match(source, /isCiphertext/);
  assert.doesNotMatch(source, /console\.log\(.*email/);
  assert.doesNotMatch(source, /console\.log\(.*label/);
});

test("package exposes the sensitive text backfill command", async () => {
  const pkg = await readSource("package.json");

  assert.match(pkg, /"encrypt:backfill": "node scripts\/backfill-sensitive-text-encryption\.mjs"/);
});
