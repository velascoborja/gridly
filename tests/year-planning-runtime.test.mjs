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
  
  // Fix imports to include .mjs extension for Node ESM
  let content = output.outputText;
  content = content.replace(/from\s+["'](\.\.?\/[^"']+)["']/g, (match, p1) => {
    if (p1.endsWith(".mjs")) return match;
    return `from "${p1}.mjs"`;
  });

  const outPath = join(outDir, relativePath.replace(/^src\//, "").replace(/\.ts$/, ".mjs"));
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, content, "utf8");
}

async function loadYearPlanningHelpers() {
  const outDir = await mkdtemp(join(process.cwd(), ".tmp-gridly-year-planning-test-"));
  await transpileModuleToTemp("src/lib/server/year-navigation.ts", outDir);
  await transpileModuleToTemp("src/lib/server/year-planning.ts", outDir);
  
  const navPath = join(outDir, "lib", "server", "year-navigation.mjs");
  const planningPath = join(outDir, "lib", "server", "year-planning.mjs");
  
  const navMod = await import(`file://${navPath}`);
  const planningMod = await import(`file://${planningPath}`);
  
  return {
    ...navMod,
    ...planningMod,
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

test("getNextCreatableYear prefers the current year while retaining consecutive future creation", async () => {
  const { getNextCreatableYear, cleanup } = await loadYearPlanningHelpers();

  try {
    assert.equal(getNextCreatableYear([2024, 2025, 2026], 2030), 2030);
  } finally {
    await cleanup();
  }
});

test("shouldAllowYearCreation accepts only the consecutive successor or the current calendar year", async () => {
  const { shouldAllowYearCreation, getNextCreatableYear, cleanup } = await loadYearPlanningHelpers();

  try {
    assert.equal(shouldAllowYearCreation([2024, 2025], 2026, 2026), true);
    assert.equal(shouldAllowYearCreation([2024, 2025], 2026, 2027), false);
    assert.equal(shouldAllowYearCreation([], 2026, 2026), true);
    assert.equal(shouldAllowYearCreation([], 2026, 2020), true);
    assert.equal(shouldAllowYearCreation([2025], 2028, 2028), true);
    assert.equal(shouldAllowYearCreation([2025], 2028, 2026), true);
    assert.equal(shouldAllowYearCreation([2025], 2028, 2027), false);
    assert.equal(shouldAllowYearCreation([2025], 2028, 2029), false);
    assert.equal(shouldAllowYearCreation([2028], 2028, 2028), false);
    assert.equal(shouldAllowYearCreation([2029], 2028, 2028), false);
    assert.equal(shouldAllowYearCreation([2029], 2028, 2030), true);
    assert.equal(shouldAllowYearCreation([2025], 2028, 2028.5), false);
    assert.equal(getNextCreatableYear([2029], 2028), 2030);
  } finally {
    await cleanup();
  }
});

test("deriveStartingBalance uses the previous december ending balance", async () => {
  const { deriveStartingBalance, cleanup } = await loadYearPlanningHelpers();

  try {
    const previousYear = {
      months: [
        { month: 11, endingBalance: 5000 },
        { month: 12, endingBalance: 6200.55 },
      ],
    };

    assert.equal(deriveStartingBalance(previousYear), 6200.55);
  } finally {
    await cleanup();
  }
});
