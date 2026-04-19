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

async function loadYearPlanningHelpers() {
  const outDir = await mkdtemp(join(process.cwd(), ".tmp-gridly-year-planning-test-"));
  await transpileModuleToTemp("src/lib/server/year-planning.ts", outDir);
  const modulePath = join(outDir, "lib", "server", "year-planning.mjs");
  const mod = await import(`file://${modulePath}`);
  return {
    ...mod,
    cleanup: () => rm(outDir, { recursive: true, force: true }),
  };
}

test("getNextCreatableYear returns the first year when none exist", async () => {
  const { getNextCreatableYear, cleanup } = await loadYearPlanningHelpers();

  try {
    assert.equal(getNextCreatableYear([], 2026), 2026);
  } finally {
    await cleanup();
  }
});

test("getNextCreatableYear returns only the immediate successor of the latest year", async () => {
  const { getNextCreatableYear, cleanup } = await loadYearPlanningHelpers();

  try {
    assert.equal(getNextCreatableYear([2024, 2025, 2026], 2030), 2027);
  } finally {
    await cleanup();
  }
});

test("shouldAllowYearCreation only accepts the next creatable year", async () => {
  const { shouldAllowYearCreation, cleanup } = await loadYearPlanningHelpers();

  try {
    assert.equal(shouldAllowYearCreation([], 2026, 2026), true);
    assert.equal(shouldAllowYearCreation([2024, 2025, 2026], 2030, 2027), true);
    assert.equal(shouldAllowYearCreation([2024, 2025, 2026], 2030, 2028), false);
  } finally {
    await cleanup();
  }
});

test("deriveStartingBalance uses the previous december ending balance", async () => {
  const { deriveStartingBalance, cleanup } = await loadYearPlanningHelpers();

  try {
    const previousYear = {
      months: [
        { month: 11, endingBalance: 1000 },
        { month: 12, endingBalance: 1234.56 },
      ],
    };

    assert.equal(deriveStartingBalance(previousYear), 1234.56);
  } finally {
    await cleanup();
  }
});
