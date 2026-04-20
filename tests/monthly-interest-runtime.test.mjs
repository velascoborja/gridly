import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import ts from "typescript";

async function transpileModuleToTemp(relativePath, outDir) {
  const sourcePath = join(process.cwd(), relativePath);
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
  const outPath = join(outDir, relativePath.replace(/^src\//, "").replace(/\.ts$/, ".mjs"));
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, output.outputText, "utf8");
}

async function loadCalculationsModule() {
  const outDir = await mkdtemp(join(process.cwd(), ".tmp-gridly-calculations-test-"));
  await transpileModuleToTemp("src/lib/calculations.ts", outDir);
  const modulePath = join(outDir, "lib", "calculations.mjs");
  const mod = await import(`file://${modulePath}`);
  return {
    ...mod,
    cleanup: () => rm(outDir, { recursive: true, force: true }),
  };
}

test("computeMonthChain auto-calculates interest from each month's starting balance unless overridden", async () => {
  const { computeMonthChain, cleanup } = await loadCalculationsModule();

  try {
    const months = computeMonthChain(
      [
        {
          id: 1,
          yearId: 1,
          month: 1,
          homeExpense: 0,
          personalExpense: 0,
          investment: 0,
          payslip: 0,
          additionalPayslip: 0,
          bonus: 0,
          interests: 0,
          interestsManualOverride: false,
          personalRemaining: 0,
          additionalExpenses: [],
          additionalIncomes: [],
        },
        {
          id: 2,
          yearId: 1,
          month: 2,
          homeExpense: 0,
          personalExpense: 0,
          investment: 0,
          payslip: 0,
          additionalPayslip: 0,
          bonus: 0,
          interests: 999,
          interestsManualOverride: true,
          personalRemaining: 0,
          additionalExpenses: [],
          additionalIncomes: [],
        },
      ],
      1200,
      0.12
    );

    assert.equal(months[0].startingBalance, 1200);
    assert.equal(months[0].interests, 12);
    assert.equal(months[0].endingBalance, 1212);
    assert.equal(months[1].startingBalance, 1212);
    assert.equal(months[1].interests, 999);
    assert.equal(months[1].endingBalance, 2211);
  } finally {
    await cleanup();
  }
});
