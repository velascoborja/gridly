import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { Adapter, AdapterAccount, AdapterSession, AdapterUser } from "@auth/core/adapters";

process.env.ENCRYPTION_KEY = randomBytes(32).toString("base64");

import { wrapEncryptedAdapter } from "./encrypted-adapter.ts";

const user: AdapterUser = {
  id: "user-1",
  email: "person@example.com",
  emailVerified: null,
  name: null,
  image: null,
};

test("OAuth secrets are encrypted at rest and decrypted when read", async () => {
  let storedAccount: AdapterAccount | null = null;
  const base: Adapter = {
    async linkAccount(account) {
      storedAccount = account;
      return account;
    },
    async getAccount() {
      return storedAccount;
    },
  };
  const adapter = wrapEncryptedAdapter(base);
  const account: AdapterAccount = {
    userId: user.id,
    type: "oauth",
    provider: "google",
    providerAccountId: "google-1",
    refresh_token: "refresh-secret",
    access_token: "access-secret",
    id_token: "id-secret",
    session_state: "session-state-secret",
  };

  await adapter.linkAccount!(account);

  const persisted = storedAccount as AdapterAccount | null;
  assert.ok(persisted);
  assert.notEqual(persisted.refresh_token, account.refresh_token);
  assert.notEqual(persisted.access_token, account.access_token);
  assert.notEqual(persisted.id_token, account.id_token);
  assert.notEqual(persisted.session_state, account.session_state);
  assert.ok(persisted.refresh_token?.startsWith("enc:"));
  assert.deepEqual(await adapter.getAccount!("google-1", "google"), account);
});

test("session tokens use encrypted lookup values and are returned as plaintext", async () => {
  const sessions = new Map<string, AdapterSession>();
  const base: Adapter = {
    async createSession(session) {
      sessions.set(session.sessionToken, session);
      return session;
    },
    async getSessionAndUser(sessionToken) {
      const session = sessions.get(sessionToken);
      return session ? { session, user } : null;
    },
    async updateSession(session) {
      const existing = sessions.get(session.sessionToken);
      if (!existing) return null;
      const updated = { ...existing, ...session };
      sessions.set(session.sessionToken, updated);
      return updated;
    },
    async deleteSession(sessionToken) {
      const deleted = sessions.get(sessionToken) ?? null;
      sessions.delete(sessionToken);
      return deleted;
    },
  };
  const adapter = wrapEncryptedAdapter(base);
  const session: AdapterSession = {
    sessionToken: "browser-cookie-token",
    userId: user.id,
    expires: new Date("2030-01-01T00:00:00.000Z"),
  };

  assert.deepEqual(await adapter.createSession!(session), session);
  const storedToken = [...sessions.keys()][0];
  assert.notEqual(storedToken, session.sessionToken);
  assert.ok(storedToken.startsWith("enc:"));
  assert.deepEqual(await adapter.getSessionAndUser!(session.sessionToken), { session, user });

  const expires = new Date("2031-01-01T00:00:00.000Z");
  assert.deepEqual(await adapter.updateSession!({ sessionToken: session.sessionToken, expires }), {
    ...session,
    expires,
  });

  await adapter.deleteSession!(session.sessionToken);
  assert.equal(sessions.size, 0);
});

test("plaintext sessions created before encryption remain readable", async () => {
  const session: AdapterSession = {
    sessionToken: "legacy-token",
    userId: user.id,
    expires: new Date("2030-01-01T00:00:00.000Z"),
  };
  const base: Adapter = {
    async getSessionAndUser(sessionToken) {
      return sessionToken === session.sessionToken ? { session, user } : null;
    },
  };

  assert.deepEqual(
    await wrapEncryptedAdapter(base).getSessionAndUser!(session.sessionToken),
    { session, user },
  );
});
