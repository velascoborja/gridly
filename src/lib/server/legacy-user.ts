import { eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, years } from "@/db/schema";
import { getEmailHash, protectUserWrite } from "@/lib/server/protected-fields";

export const LEGACY_OWNER_EMAIL = "velascoborja@gmail.com";

export async function ensureLegacyOwner(email = LEGACY_OWNER_EMAIL) {
  const existingUser = await db.query.users.findFirst({
    where: eq(users.emailHash, getEmailHash(email)),
  });

  if (existingUser) return existingUser;

  const [createdUser] = await db
    .insert(users)
    .values(
      protectUserWrite({
        email,
        name: "Borja Velasco",
      })
    )
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
