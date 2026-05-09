import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("users schema stores encrypted email separately from deterministic email hash", async () => {
  const schema = await readSource("src/db/schema.ts");

  assert.match(schema, /email:\s*text\("email"\)\.notNull\(\),/);
  assert.doesNotMatch(schema, /email:\s*text\("email"\)\.notNull\(\)\.unique\(\)/);
  assert.match(schema, /emailHash:\s*text\("email_hash"\)\.unique\(\)/);
});

test("sensitive text migration moves uniqueness from email to email_hash", async () => {
  const migration = await readSource("drizzle/0004_sensitive_text_encryption.sql");

  assert.match(migration, /ALTER TABLE "users" ADD COLUMN "email_hash" text/);
  assert.match(migration, /ALTER TABLE "users" DROP CONSTRAINT "users_email_unique"/);
  assert.match(migration, /CONSTRAINT "users_email_hash_unique" UNIQUE\("email_hash"\)/);
});

test("environment examples document server-only encryption secrets", async () => {
  const envExample = await readSource(".env.example");
  const localExample = await readSource(".env.local.example");

  for (const source of [envExample, localExample]) {
    assert.match(source, /GRIDLY_FIELD_ENCRYPTION_KEY=/);
    assert.match(source, /GRIDLY_EMAIL_HASH_KEY=/);
    assert.match(source, /GRIDLY_ALLOW_PLAINTEXT_PROTECTED_FIELDS=0/);
    assert.doesNotMatch(source, /NEXT_PUBLIC_GRIDLY_FIELD_ENCRYPTION_KEY/);
    assert.doesNotMatch(source, /NEXT_PUBLIC_GRIDLY_EMAIL_HASH_KEY/);
  }
});
