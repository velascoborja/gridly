import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("account deletion route removes the authenticated user", async () => {
  const source = await readSource("src/app/api/user/settings/route.ts");

  assert.match(source, /export async function DELETE/, "settings API should expose a DELETE handler");
  assert.match(source, /getSessionUser\(\)/, "DELETE should require the current session user");
  assert.match(source, /db\.delete\(users\)/, "DELETE should delete from the users table");
  assert.match(source, /where\(eq\(users\.id,\s*user\.id\)\)/, "DELETE should be scoped to the authenticated user id");
});

test("settings account deletion uses confirmation, pending feedback, and public redirect", async () => {
  const source = await readSource("src/components/settings/settings-form.tsx");

  assert.match(source, /AlertDialog/, "delete action should be guarded by an alert dialog");
  assert.match(source, /AlertDialogTrigger/, "delete button should open the confirmation dialog");
  assert.match(source, /AlertDialogAction/, "dialog should have an explicit destructive action");
  assert.match(source, /isDeleting/, "delete action should expose pending state");
  assert.match(source, /fetch\("\/api\/user\/settings",\s*\{\s*method:\s*"DELETE"/s, "delete confirmation should call the account DELETE API");
  assert.match(source, /accountDeleted=1/, "successful deletion should redirect with a landing confirmation flag");
  assert.doesNotMatch(source, /todoDeleteAccount/, "placeholder delete-account copy should be removed");
});

test("localized landing page can render the account deletion confirmation", async () => {
  const pageSource = await readSource("src/app/[locale]/page.tsx");
  const heroSource = await readSource("src/components/landing/public-hero.tsx");
  const esMessages = await readSource("messages/es.json");

  assert.match(pageSource, /searchParams/, "localized landing page should read query parameters");
  assert.match(pageSource, /accountDeleted/, "localized landing page should pass the deletion flag");
  assert.match(heroSource, /accountDeleted/, "public hero should render a deletion confirmation state");
  assert.match(esMessages, /"accountDeletedTitle"/, "Spanish deletion confirmation title should be present");
  assert.match(esMessages, /"accountDeletedDescription"/, "Spanish deletion confirmation description should be present");
});
