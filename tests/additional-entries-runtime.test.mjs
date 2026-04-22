import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import ts from "typescript";

async function loadAdditionalEntriesModule() {
  const outDir = await mkdtemp(join(process.cwd(), ".tmp-gridly-additional-entries-test-"));
  const sourcePath = join(process.cwd(), "src/lib/additional-entries.ts");
  const source = await readFile(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ES2022,
      target: ts.ScriptTarget.ES2022,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      allowSyntheticDefaultImports: true,
    },
    fileName: sourcePath,
  });
  const outPath = join(outDir, "lib", "additional-entries.mjs");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, output.outputText, "utf8");
  const mod = await import(`file://${outPath}`);
  return {
    ...mod,
    cleanup: () => rm(outDir, { recursive: true, force: true }),
  };
}

test("sumAdditionalEntries adds every additional entry amount", async () => {
  const { sumAdditionalEntries, cleanup } = await loadAdditionalEntriesModule();

  try {
    assert.equal(
      sumAdditionalEntries([
        { id: 1, monthId: 1, type: "income", label: "Venta", amount: 125.25 },
        { id: 2, monthId: 1, type: "income", label: "Ajuste", amount: 74.75 },
      ]),
      200,
    );
  } finally {
    await cleanup();
  }
});

test("sumAdditionalEntries returns zero for an empty list", async () => {
  const { sumAdditionalEntries, cleanup } = await loadAdditionalEntriesModule();

  try {
    assert.equal(sumAdditionalEntries([]), 0);
  } finally {
    await cleanup();
  }
});
