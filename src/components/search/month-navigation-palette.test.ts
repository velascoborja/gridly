import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const paletteSource = readFileSync(
  new URL("./month-navigation-palette.tsx", import.meta.url),
  "utf8",
);
const yearClientSource = readFileSync(
  new URL("../year/year-page-client.tsx", import.meta.url),
  "utf8",
);

test("month navigation palette is localized and keyboard accessible", () => {
  assert.match(paletteSource, /useTranslations\("MonthNavigation"\)/);
  assert.match(paletteSource, /buildMonthNavigationOptions\(locale\)/);
  assert.match(paletteSource, /filterMonthNavigationOptions\(options, query, locale\)/);
  assert.match(paletteSource, /role="combobox"/);
  assert.match(paletteSource, /role="listbox"/);
  assert.match(paletteSource, /aria-activedescendant/);
  assert.match(paletteSource, /event\.key === "ArrowDown"/);
  assert.match(paletteSource, /event\.key === "ArrowUp"/);
  assert.match(paletteSource, /event\.key === "Enter"/);
  assert.match(paletteSource, /autoFocus/);
});

test("month navigation selection is synchronous and closes the palette", () => {
  assert.match(
    paletteSource,
    /onSelect\(month\);\s+onClose\(\);/,
  );
  assert.doesNotMatch(paletteSource, /fetch\(/);
  assert.doesNotMatch(paletteSource, /useRouter/);
});

test("year page assigns distinct entry-search and month-navigation shortcuts", () => {
  assert.match(yearClientSource, /const \[monthNavigationOpen, setMonthNavigationOpen\] = useState\(false\)/);
  assert.match(yearClientSource, /e\.key\.toLowerCase\(\) === "k"/);
  assert.match(
    yearClientSource,
    /if \(e\.shiftKey\) \{\s+setSearchOpen\(false\);\s+setMonthNavigationOpen\(\(prev\) => !prev\);/,
  );
  assert.match(
    yearClientSource,
    /else \{\s+setMonthNavigationOpen\(false\);\s+setSearchOpen\(\(prev\) => !prev\);/,
  );
  assert.match(
    yearClientSource,
    /<MonthNavigationPalette[\s\S]*onSelect=\{handleMonthSelect\}/,
  );
});
