import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("ShortcutsCard has client directive, OS detection, and all shortcut groups", () => {
  const source = readFileSync(
    new URL("./shortcuts-card.tsx", import.meta.url),
    "utf8"
  );
  const esMessages = readFileSync(
    new URL("../../../messages/es.json", import.meta.url),
    "utf8"
  );
  const enMessages = readFileSync(
    new URL("../../../messages/en.json", import.meta.url),
    "utf8"
  );

  // client component with OS detection
  assert.match(source, /"use client"/);
  assert.match(source, /useTranslations\("KeyboardShortcuts"\)/);
  assert.match(source, /useState\("⌘"\)/);
  assert.match(source, /navigator\.userAgent\.includes\("Mac"\)/);
  assert.match(source, /setMod\("Ctrl"\)/);

  // Lucide Keyboard icon
  assert.match(source, /Keyboard/);

  // all three shortcut group translation keys present
  assert.match(source, /groupGlobal/);
  assert.match(source, /groupMonthNav/);
  assert.match(source, /groupEntries/);

  // all 12 shortcut action keys present
  assert.match(source, /openSearch/);
  assert.match(source, /viewMonths/);
  assert.match(source, /viewYears/);
  assert.match(source, /viewEvolution/);
  assert.match(source, /prevMonth/);
  assert.match(source, /nextMonth/);
  assert.match(source, /goToCurrentMonth/);
  assert.match(source, /addExpense/);
  assert.match(source, /addIncome/);
  assert.match(source, /createGroup/);
  assert.match(source, /toggleGroups/);
  assert.match(source, /toggleFixed/);

  // i18n messages have the namespace and key translations
  assert.match(esMessages, /"KeyboardShortcuts"/);
  assert.match(enMessages, /"KeyboardShortcuts"/);
  assert.match(esMessages, /"title": "Atajos de teclado"/);
  assert.match(enMessages, /"title": "Keyboard shortcuts"/);
});
