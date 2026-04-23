import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("public hero stacks header CTAs safely on mobile", async () => {
  const source = await readSource("src/components/landing/public-hero.tsx");

  assert.match(source, /header className="[^"]*flex-col[^"]*sm:flex-row/, "hero header should stack content vertically on mobile");
  assert.match(source, /className="[^"]*w-full[^"]*flex-col[^"]*sm:w-auto[^"]*sm:flex-row/, "hero CTA container should use a full-width mobile column layout");
  assert.match(source, /className=\{cn\(\s*buttonVariants\(\{ variant: "outline", size: "lg" \}\),\s*"[^"]*w-full[^"]*justify-center[^"]*sm:w-auto/, "demo CTA should stretch and center on mobile");
  assert.match(source, /<GoogleSignInButton className="w-full sm:w-auto" buttonClassName="w-full justify-center sm:w-auto" \/>/, "Google CTA should match the mobile-safe width behavior");
});
