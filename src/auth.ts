import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import type { AdapterUser } from "@auth/core/adapters";
import { getDatabase } from "@/db";
import { GridlyDrizzleAdapter } from "@/lib/server/auth-adapter";
import { claimLegacyYearsForUser } from "@/lib/server/legacy-user";

const database = getDatabase();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: GridlyDrizzleAdapter(database),
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
