import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from "@auth/core/adapters";
import { decryptField, encryptField, encryptSecret, isEncrypted } from "./encryption.ts";

function encryptSecretValue(value: string | undefined) {
  if (value == null || isEncrypted(value)) return value;
  return encryptSecret(value);
}

function encryptAdapterAccount(account: AdapterAccount): AdapterAccount {
  return {
    ...account,
    refresh_token: encryptSecretValue(account.refresh_token),
    access_token: encryptSecretValue(account.access_token),
    id_token: encryptSecretValue(account.id_token),
    session_state:
      typeof account.session_state === "string"
        ? encryptSecretValue(account.session_state)
        : account.session_state,
  };
}

function decryptAdapterAccount(account: AdapterAccount | null): AdapterAccount | null {
  if (!account) return null;
  return {
    ...account,
    refresh_token: account.refresh_token != null ? decryptField(account.refresh_token) : account.refresh_token,
    access_token: account.access_token != null ? decryptField(account.access_token) : account.access_token,
    id_token: account.id_token != null ? decryptField(account.id_token) : account.id_token,
    session_state:
      typeof account.session_state === "string"
        ? decryptField(account.session_state)
        : account.session_state,
  };
}

function decryptAdapterSession(session: AdapterSession | null | undefined) {
  if (!session) return session;
  return { ...session, sessionToken: decryptField(session.sessionToken) };
}

function encryptAdapterUser(user: Omit<AdapterUser, "id">): Omit<AdapterUser, "id"> {
  return {
    ...user,
    email: encryptField(user.email),
    name: user.name != null ? encryptField(user.name) : user.name,
    image: user.image != null ? encryptField(user.image) : user.image,
  };
}

function encryptAdapterUserPartial(
  user: Partial<AdapterUser> & Pick<AdapterUser, "id">
): Partial<AdapterUser> & Pick<AdapterUser, "id"> {
  return {
    ...user,
    ...(user.email != null ? { email: encryptField(user.email) } : {}),
    ...(user.name != null ? { name: encryptField(user.name) } : {}),
    ...(user.image != null ? { image: encryptField(user.image) } : {}),
  };
}

function decryptAdapterUser(user: AdapterUser | null | undefined): AdapterUser | null {
  if (!user) return null;
  return {
    ...user,
    email: decryptField(user.email),
    name: user.name != null ? decryptField(user.name) : user.name,
    image: user.image != null ? decryptField(user.image) : user.image,
  };
}

export function wrapEncryptedAdapter(base: Adapter): Adapter {
  return {
    ...base,
    async createUser(data) {
      // DrizzleAdapter accepts Omit<AdapterUser, "id"> at runtime despite the declared signature.
      return decryptAdapterUser(await base.createUser!(encryptAdapterUser(data) as unknown as AdapterUser))!;
    },
    async updateUser(data) {
      return decryptAdapterUser(await base.updateUser!(encryptAdapterUserPartial(data)))!;
    },
    async getUser(id) {
      return decryptAdapterUser(await base.getUser!(id));
    },
    async getUserByAccount(providerAccountId) {
      return decryptAdapterUser(await base.getUserByAccount!(providerAccountId));
    },
    async getUserByEmail(email) {
      const byEncrypted = await base.getUserByEmail!(encryptField(email));
      if (byEncrypted) return decryptAdapterUser(byEncrypted);
      if (!isEncrypted(email)) {
        return decryptAdapterUser(await base.getUserByEmail!(email));
      }
      return null;
    },
    async getSessionAndUser(sessionToken) {
      const encryptedToken = encryptField(sessionToken);
      const result =
        (await base.getSessionAndUser!(encryptedToken)) ??
        (isEncrypted(sessionToken) ? null : await base.getSessionAndUser!(sessionToken));
      if (!result) return null;
      return {
        session: decryptAdapterSession(result.session)!,
        user: decryptAdapterUser(result.user)!,
      };
    },
    async createSession(session) {
      const created = await base.createSession!({
        ...session,
        sessionToken: encryptField(session.sessionToken),
      });
      return decryptAdapterSession(created)!;
    },
    async updateSession(session) {
      const encrypted = await base.updateSession!({
        ...session,
        sessionToken: encryptField(session.sessionToken),
      });
      if (encrypted) return decryptAdapterSession(encrypted);
      if (isEncrypted(session.sessionToken)) return null;
      return decryptAdapterSession(await base.updateSession!(session));
    },
    async deleteSession(sessionToken) {
      const encrypted = await base.deleteSession!(encryptField(sessionToken));
      const legacy = isEncrypted(sessionToken)
        ? undefined
        : await base.deleteSession!(sessionToken);
      const deleted = encrypted ?? legacy;
      return deleted && typeof deleted === "object"
        ? decryptAdapterSession(deleted)
        : undefined;
    },
    async linkAccount(account) {
      const linked = await base.linkAccount!(encryptAdapterAccount(account));
      return linked ? decryptAdapterAccount(linked) : undefined;
    },
    async getAccount(providerAccountId, provider) {
      return decryptAdapterAccount(await base.getAccount!(providerAccountId, provider));
    },
  };
}

export function createEncryptedAdapter(
  ...args: Parameters<typeof DrizzleAdapter>
): Adapter {
  return wrapEncryptedAdapter(DrizzleAdapter(...args));
}
