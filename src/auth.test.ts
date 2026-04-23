import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("auth session callback does not trigger legacy year claims", () => {
  const authSource = readFileSync(new URL("./auth.ts", import.meta.url), "utf8");

  const sessionBlockStart = authSource.indexOf("async session(");
  const sessionBlockEnd = authSource.indexOf("return session;", sessionBlockStart);
  const sessionBlock = authSource.slice(sessionBlockStart, sessionBlockEnd);

  assert.equal(sessionBlockStart >= 0, true);
  assert.equal(sessionBlock.includes("claimLegacyYearsForUser"), false);
});
