import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const CIPHERTEXT_VERSION = "v1";
const FIELD_KEY_ENV = "GRIDLY_FIELD_ENCRYPTION_KEY";
const EMAIL_HASH_KEY_ENV = "GRIDLY_EMAIL_HASH_KEY";

type UserFields = {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  emailHash?: string | null;
};

function readBase64Key(envName: string, expectedBytes?: number): Buffer {
  const raw = process.env[envName];
  if (!raw) throw new Error(`${envName} is required for protected field operations`);

  const key = Buffer.from(raw, "base64");
  if (expectedBytes !== undefined && key.length !== expectedBytes) {
    throw new Error(`${envName} must decode to ${expectedBytes} bytes`);
  }
  if (key.length === 0) throw new Error(`${envName} must not be empty`);

  return key;
}

function encode(part: Buffer): string {
  return part.toString("base64url");
}

function decode(part: string): Buffer {
  return Buffer.from(part, "base64url");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function getEmailHash(email: string): string {
  return createHmac("sha256", readBase64Key(EMAIL_HASH_KEY_ENV))
    .update(normalizeEmail(email))
    .digest("base64url");
}

export function isProtectedFieldCiphertext(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(`${CIPHERTEXT_VERSION}:`);
}

export function allowPlaintextProtectedFields(): boolean {
  return process.env.GRIDLY_ALLOW_PLAINTEXT_PROTECTED_FIELDS === "1";
}

export function encryptField(value: string): string;
export function encryptField(value: string | null | undefined): string | null;
export function encryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;

  const key = readBase64Key(FIELD_KEY_ENV, 32);
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${CIPHERTEXT_VERSION}:${encode(iv)}:${encode(tag)}:${encode(ciphertext)}`;
}

export function decryptField(value: string): string;
export function decryptField(value: string | null | undefined): string | null;
export function decryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!isProtectedFieldCiphertext(value)) {
    if (allowPlaintextProtectedFields()) return value;
    throw new Error("Invalid protected field ciphertext");
  }

  const [version, ivPart, tagPart, ciphertextPart] = value.split(":");
  if (version !== CIPHERTEXT_VERSION || !ivPart || !tagPart || !ciphertextPart) {
    throw new Error("Invalid protected field ciphertext");
  }

  const key = readBase64Key(FIELD_KEY_ENV, 32);
  const decipher = createDecipheriv("aes-256-gcm", key, decode(ivPart));
  decipher.setAuthTag(decode(tagPart));

  return Buffer.concat([decipher.update(decode(ciphertextPart)), decipher.final()]).toString("utf8");
}

export function protectUserWrite<T extends UserFields>(data: T): T & { emailHash?: string | null } {
  const next: Record<string, unknown> = { ...data };

  if (Object.prototype.hasOwnProperty.call(data, "email") && data.email !== undefined) {
    next.emailHash = data.email ? getEmailHash(data.email) : null;
    next.email = data.email ? encryptField(data.email) : data.email;
  }
  if (Object.prototype.hasOwnProperty.call(data, "name") && data.name !== undefined) {
    next.name = data.name ? encryptField(data.name) : data.name;
  }
  if (Object.prototype.hasOwnProperty.call(data, "image") && data.image !== undefined) {
    next.image = data.image ? encryptField(data.image) : data.image;
  }

  return next as T & { emailHash?: string | null };
}

export function revealUserRead<T extends UserFields | null | undefined>(row: T): T {
  if (!row) return row;

  return {
    ...row,
    email: row.email ? decryptField(row.email) : row.email,
    name: row.name ? decryptField(row.name) : row.name,
    image: row.image ? decryptField(row.image) : row.image,
  } as T;
}

export function protectedValuesEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}
