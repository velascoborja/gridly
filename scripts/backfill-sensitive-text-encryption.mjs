import { loadEnvConfig } from "@next/env";
import { neon } from "@neondatabase/serverless";
import { createCipheriv, createHmac, randomBytes } from "node:crypto";

loadEnvConfig(process.cwd());

const CIPHERTEXT_VERSION = "v1";

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function readFieldKey() {
  const key = Buffer.from(requiredEnv("GRIDLY_FIELD_ENCRYPTION_KEY"), "base64");
  if (key.length !== 32) throw new Error("GRIDLY_FIELD_ENCRYPTION_KEY must decode to 32 bytes");
  return key;
}

function readHashKey() {
  const key = Buffer.from(requiredEnv("GRIDLY_EMAIL_HASH_KEY"), "base64");
  if (key.length === 0) throw new Error("GRIDLY_EMAIL_HASH_KEY must not be empty");
  return key;
}

function isCiphertext(value) {
  return typeof value === "string" && value.startsWith(`${CIPHERTEXT_VERSION}:`);
}

function encode(part) {
  return part.toString("base64url");
}

function encryptField(value) {
  if (value === null || value === undefined || isCiphertext(value)) return value;

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", readFieldKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${CIPHERTEXT_VERSION}:${encode(iv)}:${encode(tag)}:${encode(ciphertext)}`;
}

function emailHash(email) {
  return createHmac("sha256", readHashKey())
    .update(String(email).trim().toLowerCase())
    .digest("base64url");
}

const sql = neon(requiredEnv("DATABASE_URL"));

let usersUpdated = 0;
let additionalEntriesUpdated = 0;
let yearRecurringUpdated = 0;
let monthlyRecurringUpdated = 0;

const userRows = await sql`SELECT id, email, name, image, email_hash FROM users`;
for (const row of userRows) {
  const nextEmail = encryptField(row.email);
  const nextName = encryptField(row.name);
  const nextImage = encryptField(row.image);
  const nextEmailHash = row.email_hash ?? emailHash(row.email);

  if (
    nextEmail !== row.email ||
    nextName !== row.name ||
    nextImage !== row.image ||
    nextEmailHash !== row.email_hash
  ) {
    await sql`
      UPDATE users
      SET email = ${nextEmail}, name = ${nextName}, image = ${nextImage}, email_hash = ${nextEmailHash}
      WHERE id = ${row.id}
    `;
    usersUpdated += 1;
  }
}

async function backfillAdditionalEntries() {
  const rows = await sql`SELECT id, label FROM additional_entries`;
  let count = 0;

  for (const row of rows) {
    const nextLabel = encryptField(row.label);
    if (nextLabel !== row.label) {
      await sql`UPDATE additional_entries SET label = ${nextLabel} WHERE id = ${row.id}`;
      count += 1;
    }
  }

  return count;
}

async function backfillYearRecurringExpenses() {
  const rows = await sql`SELECT id, label FROM year_recurring_expenses`;
  let count = 0;

  for (const row of rows) {
    const nextLabel = encryptField(row.label);
    if (nextLabel !== row.label) {
      await sql`UPDATE year_recurring_expenses SET label = ${nextLabel} WHERE id = ${row.id}`;
      count += 1;
    }
  }

  return count;
}

async function backfillMonthlyRecurringExpenses() {
  const rows = await sql`SELECT id, label FROM monthly_recurring_expenses`;
  let count = 0;

  for (const row of rows) {
    const nextLabel = encryptField(row.label);
    if (nextLabel !== row.label) {
      await sql`UPDATE monthly_recurring_expenses SET label = ${nextLabel} WHERE id = ${row.id}`;
      count += 1;
    }
  }

  return count;
}

additionalEntriesUpdated = await backfillAdditionalEntries();
yearRecurringUpdated = await backfillYearRecurringExpenses();
monthlyRecurringUpdated = await backfillMonthlyRecurringExpenses();

console.log(
  JSON.stringify({
    usersUpdated,
    additionalEntriesUpdated,
    yearRecurringUpdated,
    monthlyRecurringUpdated,
  })
);
