import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("inline fixed fields support row press activation", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /activateOnRowPress\?: boolean/);
  assert.match(source, /role=\{isRowInteractive \? "button" : undefined\}/);
});

test("inline fixed fields expose an explicit save button while editing", () => {
  const source = readFileSync(new URL("./inline-edit-field.tsx", import.meta.url), "utf8");

  assert.match(source, /Loader2/);
  assert.match(source, /aria-busy=\{saving\}/);
  assert.match(source, /onClick=\{\(\) => void handleSave\(\)\}/);
  assert.match(source, /saving \? tCommon\("saving"\) : tCommon\("save"\)/);
});

test("additional entry amounts remain direct edit triggers", () => {
  const source = readFileSync(new URL("./additional-entries-card.tsx", import.meta.url), "utf8");

  assert.match(source, /onClick=\{\(\) => openEditForm\(entry\)\}/);
  assert.match(source, /aria-label=\{`\$\{t\("edit"\)\} \$\{entry\.label\}`\}/);
});

test("fixed editor reveal animates without an extra parent stack gap", () => {
  const source = readFileSync(new URL("./month-overview.tsx", import.meta.url), "utf8");

  assert.doesNotMatch(source, /<div className="space-y-6">/);
  assert.match(source, /<div className="mb-6 /);
  assert.match(source, /ref=\{fixedEditorsInnerRef\} className="overflow-hidden pb-6"/);
});
