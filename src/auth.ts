import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { AdapterUser } from "@auth/core/adapters";
import { getDatabase } from "@/db";
import { accounts, authenticators, sessions, users, verificationTokens } from "@/db/schema";
import { claimLegacyYearsForUser } from "@/lib/server/legacy-user";

const database = getDatabase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(database, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
    authenticatorsTable: authenticators,
  }),
  providers: [Google],
  pages: {
    error: "/api/auth-ui-error",
  },
  events: {
    async signIn({ user }) {
      if (user.id) {
        await claimLegacyYearsForUser(user.id, user.email);
      }
    },
    async createUser({ user }) {
      if (user.id) {
        await claimLegacyYearsForUser(user.id, user.email);
      }
    },
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user && user.id) {
        session.user.id = user.id;
        session.user.language = (user as AdapterUser & { language?: string | null }).language;
      }

      return session;
    },
  },
});
