import ExcelJS from "exceljs";
import type { YearData } from "./types";
import { formatMonthName } from "./utils";
import { avgAdditionalEntriesPerMonth } from "./additional-entries";
import { computeTagStats } from "./tag-stats";

const EXPORT_MESSAGES = {
  en: {
    expenses: "EXPENSES",
    income: "INCOME",
    totalExpenses: "Total expenses",
    totalIncome: "Total income",
    month: "Month",
    startingBalance: "Starting balance",
    savings: "Savings",
    endingBalance: "Ending balance",
    configuration: "Configuration",
    estimatedSalary: "Estimated salary",
    monthlyInvestment: "Monthly investment",
    monthlyHomeExpense: "Monthly home expense",
    monthlyPersonalBudget: "Personal budget",
    interestRate: "Interest rate",
    recurringExpenses: "Recurring expenses",
    homeExpense: "Home expenses",
    personalExpense: "Personal expenses",
    investment: "Investment",
    payslip: "Salary",
    additionalPayslip: "Extra pay",
    interests: "Interests",
    personalRemaining: "Personal surplus",
    annualSummary: "Annual summary",
    fixedExpenses: "Fixed expenses",
    additionalExpensesLabel: "Additional expenses",
    fixedIncome: "Fixed income",
    additionalIncomeLabel: "Additional income",
    totalSaved: "Total saved",
    averageSavings: "Average savings",
    maxSavings: "Max savings",
    totalInvested: "Total invested",
    avgAdditionalExpenses: "Avg. additional expenses",
    avgAdditionalIncomes: "Avg. additional incomes",
    categoriesSheet: "Categories",
    tagNameHeader: "Tag",
    tagTotalHeader: "Total",
    tagShareHeader: "% of total",
    untagged: "Untagged",
  },
  es: {
    expenses: "GASTOS",
    income: "INGRESOS",
    totalExpenses: "Total gastos",
    totalIncome: "Total ingresos",
    month: "Mes",
    startingBalance: "Saldo inicial",
    savings: "Ahorro",
    endingBalance: "Saldo final",
    configuration: "Configuración",
    estimatedSalary: "Salario estimado",
    monthlyInvestment: "Inversión mensual",
    monthlyHomeExpense: "Gasto hogar mensual",
    monthlyPersonalBudget: "Presupuesto personal",
    interestRate: "Tipo interés",
    recurringExpenses: "Gastos recurrentes",
    homeExpense: "Casa (mes siguiente)",
    personalExpense: "Gastos propios",
    investment: "Inversión",
    payslip: "Nómina",
    additionalPayslip: "Paga extra",
    interests: "Intereses",
    personalRemaining: "Sobrante propios",
    annualSummary: "Resumen anual",
    fixedExpenses: "Gastos fijos",
    additionalExpensesLabel: "Gastos adicionales",
    fixedIncome: "Ingresos fijos",
    additionalIncomeLabel: "Ingresos adicionales",
    totalSaved: "Total ahorrado",
    averageSavings: "Ahorro medio",
    maxSavings: "Ahorro máximo",
    totalInvested: "Total invertido",
    avgAdditionalExpenses: "Gastos adicionales medios",
    avgAdditionalIncomes: "Ingresos adicionales medios",
    categoriesSheet: "Categorías",
    tagNameHeader: "Etiqueta",
    tagTotalHeader: "Total",
    tagShareHeader: "% del total",
    untagged: "Sin etiqueta",
  },
} as const;

function styleHeader(ws: ExcelJS.Worksheet, cell: string, text: string) {
  const c = ws.getCell(cell);
  c.value = text;
  c.font = { bold: true, size: 11 };
  c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD9E1F2" } };
}

function money(ws: ExcelJS.Worksheet, cell: string, value: number) {
  const c = ws.getCell(cell);
  c.value = value;
  c.numFmt = "#,##0.00€";
  c.alignment = { horizontal: "right" };
}

function label(ws: ExcelJS.Worksheet, cell: string, text: string) {
  ws.getCell(cell).value = text;
}

function subsectionLabel(ws: ExcelJS.Worksheet, cell: string, text: string) {
  const c = ws.getCell(cell);
  c.value = `— ${text} —`;
  c.font = { italic: true, color: { argb: "FF888888" } };
}

function addMoneyRow(ws: ExcelJS.Worksheet, row: number, labelText: string, value: number): number {
  label(ws, `A${row}`, labelText);
  money(ws, `B${row}`, value);
  return row + 1;
}

function formatExportMonthName(month: number, locale: "en" | "es") {
  const name = formatMonthName(month, locale);
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

function buildMonthSheet(
  wb: ExcelJS.Workbook,
  year: number,
  month: YearData["months"][number],
  locale: "en" | "es",
) {
  const t = EXPORT_MESSAGES[locale];
  const sheetName = formatExportMonthName(month.month, locale);
  const ws = wb.addWorksheet(sheetName);
  ws.columns = [
    { width: 28 }, // A: expense labels
    { width: 14 }, // B: expense amounts
    { width: 2 },  // C: spacer
    { width: 28 }, // D: income labels
    { width: 14 }, // E: income amounts
  ];

  let row = 1;

  // Title
  ws.mergeCells(`A${row}:E${row}`);
  const title = ws.getCell(`A${row}`);
  title.value = `${sheetName} ${year}`;
  title.font = { bold: true, size: 13 };
  title.alignment = { horizontal: "center" };
  row += 2;

  const startRow = row;
  let expRow = startRow;
  let incRow = startRow;

  // Expenses (columns A-B)
  styleHeader(ws, `A${expRow}`, t.expenses);
  expRow++;

  subsectionLabel(ws, `A${expRow}`, t.fixedExpenses);
  expRow++;
  ws.getCell(`A${expRow}`).value = t.homeExpense;
  money(ws, `B${expRow}`, month.homeExpense);
  expRow++;
  ws.getCell(`A${expRow}`).value = t.personalExpense;
  money(ws, `B${expRow}`, month.personalExpense);
  expRow++;
  ws.getCell(`A${expRow}`).value = t.investment;
  money(ws, `B${expRow}`, month.investment);
  expRow++;
  for (const entry of month.recurringExpenses ?? []) {
    ws.getCell(`A${expRow}`).value = entry.label;
    money(ws, `B${expRow}`, entry.amount);
    expRow++;
  }

  subsectionLabel(ws, `A${expRow}`, t.additionalExpensesLabel);
  expRow++;
  for (const entry of month.additionalExpenses) {
    ws.getCell(`A${expRow}`).value = entry.label;
    money(ws, `B${expRow}`, entry.amount);
    expRow++;
  }

  styleHeader(ws, `A${expRow}`, t.totalExpenses);
  money(ws, `B${expRow}`, month.totalExpenses);
  expRow++;

  // Income (columns D-E)
  styleHeader(ws, `D${incRow}`, t.income);
  incRow++;

  subsectionLabel(ws, `D${incRow}`, t.fixedIncome);
  incRow++;
  ws.getCell(`D${incRow}`).value = t.payslip;
  money(ws, `E${incRow}`, month.payslip);
  incRow++;
  if (month.additionalPayslip > 0) {
    ws.getCell(`D${incRow}`).value = t.additionalPayslip;
    money(ws, `E${incRow}`, month.additionalPayslip);
    incRow++;
  }
  ws.getCell(`D${incRow}`).value = t.interests;
  money(ws, `E${incRow}`, month.interests);
  incRow++;
  ws.getCell(`D${incRow}`).value = t.personalRemaining;
  money(ws, `E${incRow}`, month.personalRemaining);
  incRow++;

  subsectionLabel(ws, `D${incRow}`, t.additionalIncomeLabel);
  incRow++;
  for (const entry of month.additionalIncomes) {
    ws.getCell(`D${incRow}`).value = entry.label;
    money(ws, `E${incRow}`, entry.amount);
    incRow++;
  }

  styleHeader(ws, `D${incRow}`, t.totalIncome);
  money(ws, `E${incRow}`, month.totalIncome);
  incRow++;

  // Month summary below both sections
  row = Math.max(expRow, incRow) + 1;

  label(ws, `A${row}`, t.startingBalance);
  money(ws, `B${row}`, month.startingBalance);
  row++;

  label(ws, `A${row}`, t.savings);
  const savingsCell = ws.getCell(`B${row}`);
  savingsCell.value = month.savings;
  savingsCell.numFmt = "#,##0.00€";
  savingsCell.font = { color: { argb: month.savings >= 0 ? "FF1E8449" : "FFC0392B" } };
  row++;

  label(ws, `A${row}`, t.endingBalance);
  const endCell = ws.getCell(`B${row}`);
  endCell.value = month.endingBalance;
  endCell.numFmt = "#,##0.00€";
  endCell.font = { bold: true };
}

function buildSummarySheet(
  wb: ExcelJS.Workbook,
  yearData: YearData,
  locale: "en" | "es",
) {
  const t = EXPORT_MESSAGES[locale];
  const ws = wb.addWorksheet(String(yearData.config.year));
  ws.columns = [
    { width: 28 },
    { width: 14 },
    { width: 14 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
  ];

  const months = yearData.months;
  const totalSaved = months.reduce((s, m) => s + m.savings, 0);
  const avgSavings = totalSaved / 12;
  const maxSavings = Math.max(...months.map((m) => m.savings));
  const totalInvested = months.reduce((s, m) => s + m.investment, 0);
  const avgAdditionalExpenses = avgAdditionalEntriesPerMonth(months, "expense");
  const avgAdditionalIncomes = avgAdditionalEntriesPerMonth(months, "income");

  let row = 1;

  // Year title
  ws.getCell(`A${row}`).value = String(yearData.config.year);
  ws.getCell(`A${row}`).font = { bold: true, size: 13 };
  row += 2;

  // KPI block
  styleHeader(ws, `A${row}`, t.annualSummary);
  row++;

  // Total saved with color coding
  label(ws, `A${row}`, t.totalSaved);
  const totalSavedCell = ws.getCell(`B${row}`);
  totalSavedCell.value = totalSaved;
  totalSavedCell.numFmt = "#,##0.00€";
  totalSavedCell.font = { color: { argb: totalSaved >= 0 ? "FF1E8449" : "FFC0392B" } };
  row++;

  row = addMoneyRow(ws, row, t.averageSavings, avgSavings);
  row = addMoneyRow(ws, row, t.maxSavings, maxSavings);
  row = addMoneyRow(ws, row, t.totalInvested, totalInvested);

  label(ws, `A${row}`, t.avgAdditionalExpenses);
  const avgExpCell = ws.getCell(`B${row}`);
  avgExpCell.value = avgAdditionalExpenses;
  avgExpCell.numFmt = "#,##0.00€";
  avgExpCell.alignment = { horizontal: "right" };
  avgExpCell.font = { color: { argb: "FFC0392B" } };
  row++;

  label(ws, `A${row}`, t.avgAdditionalIncomes);
  const avgIncCell = ws.getCell(`B${row}`);
  avgIncCell.value = avgAdditionalIncomes;
  avgIncCell.numFmt = "#,##0.00€";
  avgIncCell.alignment = { horizontal: "right" };
  avgIncCell.font = { color: { argb: "FF1E8449" } };
  row++;
  row++;

  // Monthly breakdown table
  styleHeader(ws, `A${row}`, t.month);
  styleHeader(ws, `B${row}`, t.startingBalance);
  styleHeader(ws, `C${row}`, t.totalIncome);
  styleHeader(ws, `D${row}`, t.totalExpenses);
  styleHeader(ws, `E${row}`, t.savings);
  styleHeader(ws, `F${row}`, t.endingBalance);
  row++;

  for (const month of months) {
    ws.getCell(`A${row}`).value = formatExportMonthName(month.month, locale);
    money(ws, `B${row}`, month.startingBalance);
    money(ws, `C${row}`, month.totalIncome);
    money(ws, `D${row}`, month.totalExpenses);
    const savingsCell = ws.getCell(`E${row}`);
    savingsCell.value = month.savings;
    savingsCell.numFmt = "#,##0.00€";
    savingsCell.font = { color: { argb: month.savings >= 0 ? "FF1E8449" : "FFC0392B" } };
    money(ws, `F${row}`, month.endingBalance);
    row++;
  }

  row++;

  // Config section
  styleHeader(ws, `A${row}`, t.configuration);
  row++;

  const cfg = yearData.config;
  const cfgItems: [string, number][] = [
    [t.estimatedSalary, cfg.estimatedSalary],
    [t.monthlyInvestment, cfg.monthlyInvestment],
    [t.monthlyHomeExpense, cfg.monthlyHomeExpense],
    [t.monthlyPersonalBudget, cfg.monthlyPersonalBudget],
    [t.interestRate, cfg.interestRate],
  ];

  for (const [text, value] of cfgItems) {
    label(ws, `A${row}`, text);
    money(ws, `B${row}`, value);
    row++;
  }
}

function buildTagSheet(wb: ExcelJS.Workbook, yearData: YearData, locale: "en" | "es") {
  const tagStats = computeTagStats(yearData);
  if (tagStats.stats.length === 0) return;

  const t = EXPORT_MESSAGES[locale];
  const ws = wb.addWorksheet(t.categoriesSheet);
  ws.columns = [
    { width: 24 }, // A: tag name
    { width: 14 }, // B: total amount
    { width: 12 }, // C: % share
  ];

  let row = 1;

  ws.mergeCells(`A${row}:C${row}`);
  const title = ws.getCell(`A${row}`);
  title.value = t.categoriesSheet;
  title.font = { bold: true, size: 13 };
  title.alignment = { horizontal: "center" };
  row += 2;

  styleHeader(ws, `A${row}`, t.tagNameHeader);
  styleHeader(ws, `B${row}`, t.tagTotalHeader);
  styleHeader(ws, `C${row}`, t.tagShareHeader);
  row++;

  for (const stat of tagStats.stats) {
    ws.getCell(`A${row}`).value = stat.tag?.name ?? t.untagged;
    money(ws, `B${row}`, stat.totalAmount);
    const shareCell = ws.getCell(`C${row}`);
    shareCell.value = stat.shareOfTotal;
    shareCell.numFmt = "0.00%";
    shareCell.alignment = { horizontal: "right" };
    row++;
  }
}

export async function buildWorkbook(yearData: YearData, locale: "en" | "es" = "es"): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gridly";

  buildSummarySheet(wb, yearData, locale);
  buildTagSheet(wb, yearData, locale);
  for (const month of yearData.months) {
    buildMonthSheet(wb, yearData.config.year, month, locale);
  }

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}
