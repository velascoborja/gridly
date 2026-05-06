import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const encryptedPrefix = "enc:v1:";
const keyEnvName = "FINANCIAL_DATA_ENCRYPTION_KEY";

function getEncryptionKey() {
  const secret = process.env[keyEnvName]?.trim();
  if (!secret) return null;

  if (secret.startsWith("hex:")) {
    const key = Buffer.from(secret.slice(4), "hex");
    if (key.length !== 32) throw new Error(`${keyEnvName} hex value must decode to 32 bytes`);
    return key;
  }

  if (secret.startsWith("base64:")) {
    const key = Buffer.from(secret.slice(7), "base64");
    if (key.length !== 32) throw new Error(`${keyEnvName} base64 value must decode to 32 bytes`);
    return key;
  }

  return createHash("sha256").update(secret).digest();
}

export function isProtectedFinancialValue(value: string) {
  return value.startsWith(encryptedPrefix);
}

export function protectFinancialText(value: string) {
  if (isProtectedFinancialValue(value)) return value;

  const key = getEncryptionKey();
  if (!key) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return [
    encryptedPrefix.slice(0, -1),
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(":");
}

export function protectFinancialNumber(value: number | string) {
  return protectFinancialText(String(value));
}

export function revealFinancialText(value: string) {
  if (!isProtectedFinancialValue(value)) return value;

  const key = getEncryptionKey();
  if (!key) {
    throw new Error(`${keyEnvName} is required to decrypt protected financial data`);
  }

  const [, version, iv, tag, encrypted] = value.split(":");
  if (version !== "v1" || !iv || !tag || !encrypted) {
    throw new Error("Invalid protected financial data format");
  }

  const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function parseProtectedFinancialNumber(value: string) {
  return parseFloat(revealFinancialText(value));
}
