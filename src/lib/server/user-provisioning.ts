import { db } from "@/db";
import { users } from "@/db/schema";

interface SessionUserLike {
  id: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
}

export async function ensureUserExists(user: SessionUserLike) {
  await db
    .insert(users)
    .values({
      id: user.id,
      email: user.email ?? `missing-email-${user.id}@gridly.local`,
      name: user.name ?? null,
      image: user.image ?? null,
    })
    .onConflictDoNothing({ target: users.id });
}
