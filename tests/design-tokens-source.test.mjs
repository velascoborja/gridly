import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

// Guards the DESIGN.md rules that can be checked from source: colors come from
// tokens in globals.css, weights stay at 600 or below, no eyebrow labels and no
// one-off shadows. TAG_COLORS in src/lib/tags.ts is the sanctioned exception.
const root = fileURLToPath(new URL("..", import.meta.url));
const scanDirs = ["src/app", "src/components"];

function collectSources(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return collectSources(path);
    if (!/\.(tsx|ts)$/.test(name) || /\.test\.ts$/.test(name)) return [];
    return [path];
  });
}

const sources = scanDirs
  .flatMap((dir) => collectSources(join(root, dir)))
  .map((path) => ({ path: relative(root, path), lines: readFileSync(path, "utf8").split("\n") }));

const RULES = [
  { name: "hex color literal", pattern: /\[#[0-9a-fA-F]{3,8}\]/ },
  {
    name: "raw Tailwind palette color",
    pattern:
      /\b(?:text|bg|border|ring|from|to|via|fill|stroke|shadow|outline|divide|decoration)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black)(?:-\d{2,3})?\b/,
  },
  { name: "bold weight (700+)", pattern: /\bfont-(?:bold|extrabold|black)\b/ },
  { name: "uppercase eyebrow label", pattern: /\buppercase\b[^"`]*tracking-(?:\[0\.|wide|wider|widest)|tracking-(?:\[0\.|wide|wider|widest)[^"`]*\buppercase\b/ },
  { name: "one-off shadow", pattern: /\bshadow-\[/ },
  { name: "rgba literal", pattern: /rgba\(/ },
];

for (const rule of RULES) {
  test(`components avoid ${rule.name}`, () => {
    const hits = sources.flatMap(({ path, lines }) =>
      lines.flatMap((line, index) => (rule.pattern.test(line) ? [`${path}:${index + 1}: ${line.trim()}`] : [])),
    );
    assert.deepEqual(hits, [], `Use a token from src/app/globals.css instead (DESIGN.md):\n${hits.join("\n")}`);
  });
}
