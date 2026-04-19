import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
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
  callbacks: {
    async signIn({ user }) {
      if (user.id) {
        await claimLegacyYearsForUser(user.id, user.email);
      }

      return true;
    },
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }

      return session;
    },
  },
});
