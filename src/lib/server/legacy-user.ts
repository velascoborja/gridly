import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, years } from "@/db/schema";

export const LEGACY_OWNER_EMAIL = process.env.LEGACY_OWNER_EMAIL ?? "";

// NOTE: This function bypasses the encrypted adapter — it queries and inserts users
// directly via Drizzle. After ENCRYPTION_KEY is set, any new legacy-owner rows it
// creates will have a plaintext email, and the eq(users.email, email) lookup will
// miss any row whose email was encrypted by the adapter. If you need to call this
// after encryption is deployed, route through the NextAuth adapter instead or
// call encryptField on the email before the lookup/insert.
export async function ensureLegacyOwner(email = LEGACY_OWNER_EMAIL) {
  if (!email) return null;

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) return existingUser;

  const [createdUser] = await db
    .insert(users)
    .values({
      email,
    })
    .returning();

  return createdUser;
}

export async function claimLegacyYearsForUser(userId: string, email?: string | null) {
  if (email !== LEGACY_OWNER_EMAIL) return;

  await db
    .update(years)
    .set({ userId })
    .where(isNull(years.userId));
}
