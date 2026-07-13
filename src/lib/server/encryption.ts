import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

const ENC_PREFIX = "enc:";

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY;
  if (!raw) throw new Error("ENCRYPTION_KEY is not set");
  const key = Buffer.from(raw, "base64");
  if (key.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes (base64-encoded)");
  return key;
}

export function encryptField(plaintext: string): string {
  const key = getKey();
  const ivKey = createHmac("sha256", key).update("iv-derivation").digest();
  const iv = createHmac("sha256", ivKey).update(plaintext).digest().slice(0, 12);
  return encryptWithIv(plaintext, key, iv);
}

export function encryptSecret(plaintext: string): string {
  return encryptWithIv(plaintext, getKey(), randomBytes(12));
}

function encryptWithIv(plaintext: string, key: Buffer, iv: Buffer): string {
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return ENC_PREFIX + Buffer.concat([iv, ciphertext, authTag]).toString("base64");
}

export function decryptField(value: string): string {
  if (!value.startsWith(ENC_PREFIX)) return value;
  const key = getKey();
  const buf = Buffer.from(value.slice(ENC_PREFIX.length), "base64");
  if (buf.length < 28) throw new Error("Encrypted field value is malformed or truncated");
  const iv = buf.subarray(0, 12);
  const authTag = buf.subarray(buf.length - 16);
  const ciphertext = buf.subarray(12, buf.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENC_PREFIX);
}
