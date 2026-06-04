import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("HelpCard has client directive, Help namespace, and navigates to /help", () => {
  const source = readFileSync(
    new URL("./help-card.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /"use client"/);
  assert.match(source, /useTranslations\("Help"\)/);
  assert.match(source, /cardTitle/);
  assert.match(source, /cardDescription/);
  assert.match(source, /cardButton/);
  assert.match(source, /\/help/);
  assert.match(source, /HelpCircle/);
});

test("SettingsForm imports and renders HelpCard", () => {
  const source = readFileSync(
    new URL("./settings-form.tsx", import.meta.url),
    "utf8"
  );

  assert.match(source, /HelpCard/);
  assert.match(source, /from ".\/help-card"/);
});
