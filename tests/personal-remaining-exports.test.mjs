import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import ExcelJS from 'exceljs';
import { loadFinancialModules } from './helpers/financial-modules.mjs';

const harness = await loadFinancialModules({
  calculations: 'src/lib/calculations.ts',
  excel: 'src/lib/export.ts',
  markdown: 'src/lib/monthly-markdown-export.ts',
  evolution: 'src/lib/evolution.ts',
  rate: 'src/lib/annual-savings-rate.ts',
});
after(harness.cleanup);
const { calculations, excel, markdown, evolution, rate } = harness.modules;
const config = { id: 1, year: 2026, startingBalance: 1000, estimatedSalary: 2000,
  hasExtraPayments: false, estimatedExtraPayment: 0, monthlyInvestment: 100,
  monthlyHomeExpense: 500, monthlyPersonalBudget: 200, interestRate: 0 };
function data(remaining) {
  const raw = Array.from({ length: 12 }, (_, index) => ({
    ...calculations.estimatedMonthData(index + 1, config), id: index + 1, yearId: 1, personalRemaining: remaining,
  }));
  return { config, recurringExpenses: [], months: calculations.computeMonthChain(raw, config.startingBalance) };
}
function rowFor(sheet, column, label) {
  for (let row = 1; row <= sheet.rowCount; row++) {
    if (sheet.getCell(`${column}${row}`).value === label) return row;
  }
  return null;
}
for (const locale of ['es', 'en']) {
  for (const remaining of [0, 50, 200, 250, -20]) {
    test(`${locale} Excel, Markdown and Evolution agree for surplus ${remaining}`, async () => {
      const year = data(remaining);
      const buffer = await excel.buildWorkbook(year, locale);
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer);
      const sheet = workbook.getWorksheet(locale === 'es' ? 'Enero' : 'January');
      const surplusLabel = locale === 'es' ? 'Sobrante propios' : 'Personal surplus';
      const surplusRow = rowFor(sheet, 'A', surplusLabel);
      assert.ok(surplusRow);
      assert.equal(sheet.getCell(`B${surplusRow}`).value, -remaining || 0);
      assert.equal(rowFor(sheet, 'D', surplusLabel), null);
      const expenseRow = rowFor(sheet, 'A', locale === 'es' ? 'Total gastos' : 'Total expenses');
      const incomeRow = rowFor(sheet, 'D', locale === 'es' ? 'Total ingresos' : 'Total income');
      assert.equal(sheet.getCell(`B${expenseRow}`).value, 800 - remaining);
      assert.equal(sheet.getCell(`E${incomeRow}`).value, 2000);
      const md = markdown.buildMonthlyMarkdown(year, 1, locale);
      const fixedExpenseSection = md.split(locale === 'es' ? '## Gastos fijos' : '## Fixed expenses')[1]
        .split(locale === 'es' ? '## Gastos mes actual' : '## Current month expenses')[0];
      assert.match(fixedExpenseSection, /Personal surplus|Remanente personal/);
      assert.ok(fixedExpenseSection.includes(new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'es-ES', {
        style: 'currency', currency: 'EUR', maximumFractionDigits: 0,
      }).format(-remaining)));
      const incomeSection = md.split(locale === 'es' ? '### Ingresos fijos' : '### Fixed income')[1];
      assert.doesNotMatch(incomeSection, /Personal surplus|Remanente personal/);
      const [metric] = evolution.deriveEvolutionMetrics([{ source: 'gridly', yearData: year }]);
      assert.equal(metric.totalIncome, 24000);
      assert.equal(metric.totalExpenses, (800 - remaining) * 12);
      assert.equal(metric.savedAmount, (1200 + remaining) * 12);
      assert.equal(metric.savingsRate, rate.calculateSavingsRate(metric.savedAmount, metric.totalIncome));
    });
  }
}
