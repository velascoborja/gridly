import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("additional entries card source includes mutation feedback states", async () => {
  const source = await readSource("src/components/monthly/additional-entries-card.tsx");

  assert.match(source, /const \[isAdding, setIsAdding\] = useState\(false\);/, "add flow should track a pending state");
  assert.match(source, /const \[savingId, setSavingId\] = useState<number \| null>\(null\);/, "edit flow should track which row is saving");
  assert.match(source, /const \[deletingId, setDeletingId\] = useState<number \| null>\(null\);/, "delete flow should track which row is deleting");
  assert.match(source, /animate-spin/, "pending controls should show a spinner");
  assert.match(source, /aria-busy=\{isAdding\}/, "the add form should expose a busy state");
  assert.match(source, /disabled=\{isAdding\}/, "the add action should disable while pending");
  assert.match(source, /disabled=\{savingId === entry\.id\}/, "the save action should disable the active row while pending");
  assert.match(source, /disabled=\{deletingId === entry\.id\}/, "the delete confirmation should disable while pending");
});
