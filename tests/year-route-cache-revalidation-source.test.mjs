import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function readSource(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("year settings mutations revalidate annual summary routes", async () => {
  const source = await readSource("src/app/api/years/[year]/route.ts");

  assert.match(source, /import \{ revalidatePath \} from "next\/cache"/);
  assert.match(source, /revalidatePath\(`\/\$\{yearNum\}\/summary`\)/);
  assert.match(source, /for \(const locale of \["es", "en"\]\)/);
  assert.match(source, /revalidatePath\(`\/\$\{locale\}\/\$\{yearNum\}\/summary`\)/);
});
