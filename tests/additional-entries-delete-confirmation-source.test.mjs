import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("additional entries require confirmation before deletion", async () => {
  const source = await readSource("src/components/monthly/additional-entries-card.tsx");
  const esMessages = await readSource("messages/es.json");

  assert.match(source, /AlertDialog/, "delete action should be wrapped in an alert dialog");
  assert.match(source, /AlertDialogTrigger/, "trash button should open the confirmation dialog");
  assert.match(source, /AlertDialogAction/, "confirmation action should perform deletion");
  assert.match(source, /confirmDeleteTitle/, "dialog title should use localized copy");
  assert.match(source, /confirmDeleteDescription/, "dialog description should use localized copy");
  assert.match(esMessages, /"confirmDeleteTitle"/, "Spanish confirmation title should be present");
  assert.match(esMessages, /"confirmDeleteDescription"/, "Spanish confirmation description should be present");
});
