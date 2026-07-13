import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";

// Set before any test runs — functions read the key lazily
process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

import { decryptField, encryptField, encryptSecret, isEncrypted } from "./encryption.ts";

test("encryptField returns an enc:-prefixed string", () => {
  const result = encryptField("user@example.com");
  assert.ok(result.startsWith("enc:"), `expected enc: prefix, got: ${result}`);
});

test("decryptField reverses encryptField", () => {
  const original = "user@example.com";
  assert.equal(decryptField(encryptField(original)), original);
});

test("decryptField passes through plaintext values unchanged", () => {
  assert.equal(decryptField("user@example.com"), "user@example.com");
  assert.equal(decryptField("John Doe"), "John Doe");
});

test("encryptField is deterministic — same input produces same output", () => {
  const email = "user@example.com";
  assert.equal(encryptField(email), encryptField(email));
});

test("encryptField produces different ciphertext for different inputs", () => {
  assert.notEqual(encryptField("a@example.com"), encryptField("b@example.com"));
});

test("encryptSecret uses a random IV while remaining decryptable", () => {
  const first = encryptSecret("oauth-token");
  const second = encryptSecret("oauth-token");

  assert.notEqual(first, second);
  assert.equal(decryptField(first), "oauth-token");
  assert.equal(decryptField(second), "oauth-token");
});

test("isEncrypted returns true for encrypted values", () => {
  assert.equal(isEncrypted(encryptField("user@example.com")), true);
});

test("isEncrypted returns false for plaintext values", () => {
  assert.equal(isEncrypted("user@example.com"), false);
});

test("decryptField throws on tampered ciphertext", () => {
  const encrypted = encryptField("user@example.com");
  const tampered = encrypted.slice(0, -4) + "XXXX";
  assert.throws(() => decryptField(tampered));
});
