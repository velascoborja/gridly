import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("auth configuration sends Auth.js errors to the localized landing screen", async () => {
  const source = await readSource("src/auth.ts");

  assert.match(source, /pages:\s*\{[\s\S]*error:\s*"\/api\/auth-ui-error"/, "Auth.js should not render its built-in error page");
});

test("auth error route creates a fresh landing error URL for each cancellation", async () => {
  const source = await readSource("src/app/api/auth-ui-error/route.ts");

  assert.match(source, /NextResponse\.redirect/, "auth error route should redirect into the app UI");
  assert.match(source, /authError/, "redirect should flag the landing auth error state");
  assert.match(source, /authErrorId/, "redirect should include a changing event id for repeated cancellations");
  assert.match(source, /randomUUID\(\)/, "auth error id should be generated per request");
});

test("localized landing page renders an auth error message from the query string", async () => {
  const pageSource = await readSource("src/app/[locale]/page.tsx");
  const heroSource = await readSource("src/components/landing/public-hero.tsx");
  const esMessages = await readSource("messages/es.json");

  assert.match(pageSource, /authError/, "localized landing page should read the auth error flag");
  assert.match(heroSource, /authError/, "public hero should render an auth error state");
  assert.match(esMessages, /"authErrorTitle"/, "Spanish auth error title should be present");
  assert.match(esMessages, /"authErrorDescription"/, "Spanish auth error description should be present");
});
