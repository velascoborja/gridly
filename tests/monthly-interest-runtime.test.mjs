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

test("estimatedMonthData only applies configured extra payments when enabled", async () => {
  const { estimatedMonthData, cleanup } = await loadCalculationsModule();

  try {
    const config = {
      id: 1,
      year: 2026,
      startingBalance: 0,
      estimatedSalary: 2000,
      monthlyInvestment: 0,
      monthlyHomeExpense: 0,
      monthlyPersonalBudget: 0,
      interestRate: 0,
      hasExtraPayments: false,
      estimatedExtraPayment: 1200,
    };

    assert.equal(estimatedMonthData(6, config).additionalPayslip, 0);
    assert.equal(estimatedMonthData(12, config).additionalPayslip, 0);

    const enabledConfig = {
      ...config,
      hasExtraPayments: true,
    };

    assert.equal(estimatedMonthData(5, enabledConfig).additionalPayslip, 0);
    assert.equal(estimatedMonthData(6, enabledConfig).additionalPayslip, 1200);
    assert.equal(estimatedMonthData(12, enabledConfig).additionalPayslip, 1200);
  } finally {
    await cleanup();
  }
});

test("applyYearConfigToMonth overwrites monthly setup fields while preserving activity fields", async () => {
  const { applyYearConfigToMonth, cleanup } = await loadCalculationsModule();

  try {
    const updated = applyYearConfigToMonth(
      {
        id: 10,
        yearId: 20,
        month: 6,
        homeExpense: 999,
        personalExpense: 888,
        investment: 777,
        payslip: 666,
        additionalPayslip: 555,
        bonus: 444,
        interests: 333,
        interestsManualOverride: true,
        personalRemaining: 222,
        additionalExpenses: [{ id: 1, monthId: 10, type: "expense", label: "Manual", amount: 11 }],
        additionalIncomes: [{ id: 2, monthId: 10, type: "income", label: "Manual", amount: 22 }],
      },
      {
        id: 1,
        year: 2026,
        startingBalance: 1000,
        estimatedSalary: 2100,
        monthlyInvestment: 300,
        monthlyHomeExpense: 700,
        monthlyPersonalBudget: 450,
        interestRate: 0.02,
        hasExtraPayments: true,
        estimatedExtraPayment: 2100,
      },
    );

    assert.equal(updated.homeExpense, 700);
    assert.equal(updated.personalExpense, 450);
    assert.equal(updated.investment, 300);
    assert.equal(updated.payslip, 2100);
    assert.equal(updated.additionalPayslip, 2100);
    assert.equal(updated.interests, 0);
    assert.equal(updated.interestsManualOverride, false);
    assert.equal(updated.bonus, 444);
    assert.equal(updated.personalRemaining, 222);
    assert.deepEqual(updated.additionalExpenses, [{ id: 1, monthId: 10, type: "expense", label: "Manual", amount: 11 }]);
    assert.deepEqual(updated.additionalIncomes, [{ id: 2, monthId: 10, type: "income", label: "Manual", amount: 22 }]);
  } finally {
    await cleanup();
  }
});
