import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("account deletion requires a typed second confirmation before the delete request", () => {
  const source = readFileSync(new URL("./settings-form.tsx", import.meta.url), "utf8");
  const esMessages = readFileSync(new URL("../../../messages/es.json", import.meta.url), "utf8");
  const enMessages = readFileSync(new URL("../../../messages/en.json", import.meta.url), "utf8");

  assert.match(source, /type DeleteConfirmationStep = "impact" \| "typed"/);
  assert.match(source, /const \[deleteConfirmationStep, setDeleteConfirmationStep\]/);
  assert.match(source, /const \[deleteConfirmationText, setDeleteConfirmationText\]/);
  assert.match(source, /const requiredDeleteConfirmation = t\("deleteAccountConfirmationPhrase"\)/);
  assert.match(source, /const canConfirmAccountDeletion = deleteConfirmationText\.trim\(\) === requiredDeleteConfirmation/);
  assert.match(source, /setDeleteConfirmationStep\("typed"\)/);
  assert.match(source, /value=\{deleteConfirmationText\}/);
  assert.match(source, /onChange=\{\(event\) => setDeleteConfirmationText\(event\.target\.value\)\}/);
  assert.match(source, /disabled=\{isDeleting \|\| !canConfirmAccountDeletion\}/);
  assert.match(source, /onClick=\{handleDeleteAccount\}/);
  assert.match(source, /deleteAccountSecondTitle/);

  assert.match(esMessages, /"deleteAccountConfirmationPhrase": "ELIMINAR"/);
  assert.match(enMessages, /"deleteAccountConfirmationPhrase": "DELETE"/);
});
