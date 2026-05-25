"use server";

import { signOut as authSignOut } from "@/auth";

export async function signOut() {
  try {
    await authSignOut({ redirectTo: "/" });
  } catch (e) {
    // redirect() throws a NEXT_REDIRECT marker; session is already cleared.
    if (
      typeof e === "object" &&
      e !== null &&
      "digest" in e &&
      typeof (e as { digest: string }).digest === "string" &&
      (e as { digest: string }).digest.startsWith("NEXT_REDIRECT")
    ) {
      return;
    }
    throw e;
  }
}
