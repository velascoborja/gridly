import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { Adapter, AdapterAccount, AdapterUser } from "@auth/core/adapters";
import { eq } from "drizzle-orm";
import type { getDatabase } from "@/db";
import { accounts, authenticators, sessions, users, verificationTokens } from "@/db/schema";
import { getEmailHash, protectUserWrite, revealUserRead } from "@/lib/server/protected-fields";

type Database = ReturnType<typeof getDatabase>;

const adapterTables = {
  usersTable: users,
  accountsTable: accounts,
  sessionsTable: sessions,
  verificationTokensTable: verificationTokens,
  authenticatorsTable: authenticators,
};

function revealAdapterUser<T extends AdapterUser | null | undefined>(user: T): T {
  return revealUserRead(user) as T;
}

export function GridlyDrizzleAdapter(database: Database): Adapter {
  const base = DrizzleAdapter(database, adapterTables);

  return {
    ...base,
    async createUser(data) {
      const created = await base.createUser!(protectUserWrite(data));
      return revealAdapterUser(created);
    },
    async getUser(userId) {
      const user = await base.getUser!(userId);
      return revealAdapterUser(user);
    },
    async getUserByEmail(email) {
      const [user] = await database
        .select()
        .from(users)
        .where(eq(users.emailHash, getEmailHash(email)))
        .limit(1);

      return revealAdapterUser((user ?? null) as AdapterUser | null);
    },
    async getSessionAndUser(sessionToken) {
      const result = await base.getSessionAndUser!(sessionToken);
      if (!result) return null;

      return {
        session: result.session,
        user: revealAdapterUser(result.user),
      };
    },
    async updateUser(data) {
      const updated = await base.updateUser!(protectUserWrite(data));
      return revealAdapterUser(updated);
    },
    async getUserByAccount(account) {
      const user = await base.getUserByAccount!(account);
      return revealAdapterUser(user);
    },
    async linkAccount(data: AdapterAccount) {
      const minimizedAccount = {
        ...data,
        access_token: undefined,
        refresh_token: undefined,
        id_token: undefined,
      };

      await base.linkAccount!(minimizedAccount);
    },
  };
}
