import test from "node:test";
import assert from "node:assert/strict";
import {
  decryptField,
  encryptField,
  getEmailHash,
  isProtectedFieldCiphertext,
  normalizeEmail,
  protectUserWrite,
  revealUserRead,
} from "./protected-fields.ts";

const fieldKey = Buffer.alloc(32, 7).toString("base64");
const hashKey = Buffer.alloc(32, 13).toString("base64");

function withSecrets() {
  process.env.GRIDLY_FIELD_ENCRYPTION_KEY = fieldKey;
  process.env.GRIDLY_EMAIL_HASH_KEY = hashKey;
  process.env.GRIDLY_ALLOW_PLAINTEXT_PROTECTED_FIELDS = "0";
}

test.beforeEach(withSecrets);

test("encryptField returns versioned non-deterministic ciphertext and decrypts it", () => {
  const first = encryptField("velasco@example.com");
  const second = encryptField("velasco@example.com");

  assert.equal(isProtectedFieldCiphertext(first), true);
  assert.equal(isProtectedFieldCiphertext(second), true);
  assert.notEqual(first, second);
  assert.equal(decryptField(first), "velasco@example.com");
  assert.equal(decryptField(second), "velasco@example.com");
});

test("email hash is deterministic after normalization", () => {
  assert.equal(normalizeEmail("  Borja@Example.COM "), "borja@example.com");
  assert.equal(getEmailHash("Borja@Example.COM"), getEmailHash(" borja@example.com "));
});

test("user write protection encrypts profile fields and adds emailHash", () => {
  const protectedUser = protectUserWrite({
    email: "Borja@Example.COM",
    name: "Borja Velasco",
    image: "https://example.com/avatar.png",
    language: "es",
  });

  assert.notEqual(protectedUser.email, "Borja@Example.COM");
  assert.notEqual(protectedUser.name, "Borja Velasco");
  assert.notEqual(protectedUser.image, "https://example.com/avatar.png");
  assert.equal(protectedUser.emailHash, getEmailHash("borja@example.com"));

  const revealed = revealUserRead(protectedUser);
  assert.equal(revealed.email, "Borja@Example.COM");
  assert.equal(revealed.name, "Borja Velasco");
  assert.equal(revealed.image, "https://example.com/avatar.png");
});

test("missing encryption secret fails closed", () => {
  delete process.env.GRIDLY_FIELD_ENCRYPTION_KEY;

  assert.throws(() => encryptField("secret"), /GRIDLY_FIELD_ENCRYPTION_KEY/);
});

test("plaintext fallback is explicit and disabled by default", () => {
  assert.throws(() => decryptField("plain text"), /Invalid protected field ciphertext/);

  process.env.GRIDLY_ALLOW_PLAINTEXT_PROTECTED_FIELDS = "1";
  assert.equal(decryptField("plain text"), "plain text");
});
