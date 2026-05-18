import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

import ExcelJS from "exceljs";
import ts from "typescript";

async function transpileModuleToTemp(relativePath, outDir) {
  const sourcePath = join(process.cwd(), relativePath);
  const source = await readFile(sourcePath, "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
    },
    fileName: sourcePath,
  });
  const rewritten = output.outputText.replace(/require\("(\.[^"]+)"\)/g, 'require("$1.cjs")');
  const outPath = join(outDir, relativePath.replace(/^src\//, "").replace(/\.ts$/, ".cjs"));
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, rewritten, "utf8");
}

async function loadBuildWorkbook() {
  const outDir = await mkdtemp(join(process.cwd(), ".tmp-gridly-export-test-"));
  await transpileModuleToTemp("src/lib/utils.ts", outDir);
  await transpileModuleToTemp("src/lib/additional-entries.ts", outDir);
  await transpileModuleToTemp("src/lib/export.ts", outDir);
  const modulePath = join(outDir, "lib", "export.cjs");
  const mod = await import(`file://${modulePath}`);
  return {
    buildWorkbook: mod.buildWorkbook,
    cleanup: () => rm(outDir, { recursive: true, force: true }),
  };
}

function findRow(worksheet, predicate) {
  for (let row = 1; row <= worksheet.rowCount; row += 1) {
    if (predicate(row)) {
      return row;
    }
  }
  return -1;
}

const yearData = {
  config: {
    id: 1,
    year: 2026,
    startingBalance: 1000,
    estimatedSalary: 2000,
    monthlyInvestment: 300,
    monthlyHomeExpense: 500,
    monthlyPersonalBudget: 400,
    interestRate: 2.5,
  },
  months: Array.from({ length: 12 }, (_, index) => {
    const month = index + 1;
    const additionalExpense = month === 1 ? [{ id: 1, monthId: 1, type: "expense", label: "Seguro", amount: 25 }] : [];
    const additionalIncome = month === 12 ? [{ id: 2, monthId: 12, type: "income", label: "Regalo", amount: 50 }] : [];
    const totalExpenses = 1200 + additionalExpense.reduce((sum, entry) => sum + entry.amount, 0);
    const totalIncome = 2200 + additionalIncome.reduce((sum, entry) => sum + entry.amount, 0);
    const savings = totalIncome - totalExpenses;
    const startingBalance = 1000 + index * 1000;
    return {
      id: month,
      yearId: 1,
      month,
      homeExpense: 500,
      personalExpense: 400,
      investment: 300,
      payslip: 2000,
      additionalPayslip: month === 6 || month === 12 ? 2000 : 0,
      bonus: 100,
      interests: 50,
      personalRemaining: 50,
      recurringExpenses: [],
      additionalExpenses: additionalExpense,
      additionalExpenseGroups: [],
      additionalIncomes: additionalIncome,
      totalIncome,
      totalExpenses,
      savings,
      startingBalance,
      endingBalance: startingBalance + savings,
    };
  }),
};

test("excel export produces a 13-sheet workbook with summary first and one sheet per month", async () => {
  const { buildWorkbook, cleanup } = await loadBuildWorkbook();

  try {
    const buffer = await buildWorkbook(yearData);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    // Should have 1 summary sheet + 12 month sheets
    assert.equal(workbook.worksheets.length, 13);

    // First sheet is the annual summary named after the year
    const summarySheet = workbook.worksheets[0];
    assert.equal(summarySheet.name, "2026");

    // Summary sheet has the KPI block header
    const kpiHeaderRow = findRow(summarySheet, (row) => summarySheet.getCell(`A${row}`).value === "Resumen anual");
    assert.ok(kpiHeaderRow > 0, "Summary sheet should have annual KPI block header");

    // Summary sheet has the monthly breakdown table (Mes header)
    const summaryTableRow = findRow(
      summarySheet,
      (row) =>
        summarySheet.getCell(`A${row}`).value === "Mes" &&
        summarySheet.getCell(`B${row}`).value === "Saldo inicial" &&
        summarySheet.getCell(`F${row}`).value === "Saldo final",
    );
    assert.ok(summaryTableRow > kpiHeaderRow, "Monthly breakdown table should appear after KPI block");

    // Summary sheet has the config section
    const configHeaderRow = findRow(summarySheet, (row) => summarySheet.getCell(`A${row}`).value === "Configuración");
    assert.ok(configHeaderRow > summaryTableRow, "Config section should appear after monthly breakdown table");

    // Month sheets exist with correct names
    assert.equal(workbook.worksheets[1].name, "Enero");
    assert.equal(workbook.worksheets[12].name, "Diciembre");

    // December sheet has fixed and additional income subsections
    const decemberSheet = workbook.worksheets[12];
    const fixedIncomeRow = findRow(decemberSheet, (row) => {
      const val = decemberSheet.getCell(`D${row}`).value;
      return typeof val === "string" && val.includes("Ingresos fijos");
    });
    assert.ok(fixedIncomeRow > 0, "December sheet should have fixed income subsection");

    // December sheet has additional income (Regalo entry for month 12)
    const regaloRow = findRow(decemberSheet, (row) => decemberSheet.getCell(`D${row}`).value === "Regalo");
    assert.ok(regaloRow > 0, "December sheet should show additional income entry 'Regalo'");
  } finally {
    await cleanup();
  }
});
