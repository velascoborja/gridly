import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

function read(relative: string) {
  return readFileSync(new URL(relative, import.meta.url), "utf8");
}

test("historical year dialog includes an optional interest earned field", () => {
  const source = read("./historical-year-dialog.tsx");
  assert.match(source, /interestsEarned/, "dialog should track interestsEarned state");
  assert.match(source, /t\("interestEarned"\)/, "dialog should label the interest field");
});
