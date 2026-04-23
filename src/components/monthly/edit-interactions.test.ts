import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("inline fixed fields support row press activation", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /activateOnRowPress\?: boolean/);
  assert.match(source, /role=\{isRowInteractive \? "button" : undefined\}/);
});

test("additional entry amounts remain direct edit triggers", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");

  assert.match(source, /onClick=\{\(\) => openEditForm\(entry\)\}/);
  assert.match(source, /aria-label=\{`\$\{t\("edit"\)\} \$\{entry\.label\}`\}/);
});
