import { DrizzleAdapter } from "@auth/drizzle-adapter";
import type { Adapter, AdapterUser } from "@auth/core/adapters";
import { encryptField, decryptField } from "./encryption";

function encryptAdapterUser(user: Omit<AdapterUser, "id">): Omit<AdapterUser, "id"> {
  return {
    ...user,
    email: encryptField(user.email),
    name: user.name != null ? encryptField(user.name) : user.name,
  };
}

function encryptAdapterUserPartial(
  user: Partial<AdapterUser> & Pick<AdapterUser, "id">
): Partial<AdapterUser> & Pick<AdapterUser, "id"> {
  return {
    ...user,
    ...(user.email != null ? { email: encryptField(user.email) } : {}),
    ...(user.name != null ? { name: encryptField(user.name) } : {}),
  };
}

function decryptAdapterUser(user: AdapterUser | null | undefined): AdapterUser | null {
  if (!user) return null;
  return {
    ...user,
    email: decryptField(user.email),
    name: user.name != null ? decryptField(user.name) : user.name,
  };
}

export function createEncryptedAdapter(
  ...args: Parameters<typeof DrizzleAdapter>
): Adapter {
  const base = DrizzleAdapter(...args);
  return {
    ...base,
    async createUser(data) {
      return decryptAdapterUser(await base.createUser!(encryptAdapterUser(data) as AdapterUser))!;
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
      return decryptAdapterUser(await base.getUserByEmail!(email));
    },
  };
}
