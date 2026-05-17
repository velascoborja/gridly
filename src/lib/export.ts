import ExcelJS from "exceljs";
import type { YearData } from "./types";
import { formatMonthName } from "./utils";

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
  ws.columns = [{ width: 32 }, { width: 16 }];

  let row = 1;

  // Title
  ws.mergeCells(`A${row}:B${row}`);
  const title = ws.getCell(`A${row}`);
  title.value = `${sheetName} ${year}`;
  title.font = { bold: true, size: 13 };
  title.alignment = { horizontal: "center" };
  row += 2;

  // Expenses section
  styleHeader(ws, `A${row}`, t.expenses);
  row++;

  subsectionLabel(ws, `A${row}`, t.fixedExpenses);
  row++;
  row = addMoneyRow(ws, row, t.homeExpense, month.homeExpense);
  row = addMoneyRow(ws, row, t.personalExpense, month.personalExpense);
  row = addMoneyRow(ws, row, t.investment, month.investment);
  for (const entry of month.recurringExpenses ?? []) {
    row = addMoneyRow(ws, row, entry.label, entry.amount);
  }

  subsectionLabel(ws, `A${row}`, t.additionalExpensesLabel);
  row++;
  for (const entry of month.additionalExpenses) {
    row = addMoneyRow(ws, row, entry.label, entry.amount);
  }

  styleHeader(ws, `A${row}`, t.totalExpenses);
  money(ws, `B${row}`, month.totalExpenses);
  row += 2;

  // Income section
  styleHeader(ws, `A${row}`, t.income);
  row++;

  subsectionLabel(ws, `A${row}`, t.fixedIncome);
  row++;
  row = addMoneyRow(ws, row, t.payslip, month.payslip);
  if (month.additionalPayslip > 0) {
    row = addMoneyRow(ws, row, t.additionalPayslip, month.additionalPayslip);
  }
  row = addMoneyRow(ws, row, t.interests, month.interests);
  row = addMoneyRow(ws, row, t.personalRemaining, month.personalRemaining);

  subsectionLabel(ws, `A${row}`, t.additionalIncomeLabel);
  row++;
  for (const entry of month.additionalIncomes) {
    row = addMoneyRow(ws, row, entry.label, entry.amount);
  }

  styleHeader(ws, `A${row}`, t.totalIncome);
  money(ws, `B${row}`, month.totalIncome);
  row += 2;

  // Month summary
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

export async function buildWorkbook(yearData: YearData, locale: "en" | "es" = "es"): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gridly";
  const t = EXPORT_MESSAGES[locale];

  const ws = wb.addWorksheet(String(yearData.config.year));
  ws.columns = [
    { width: 28 },
    { width: 14 },
    { width: 4 },
    { width: 28 },
    { width: 14 },
    { width: 14 },
  ];

  let currentRow = 1;
  for (const month of yearData.months) {
    currentRow = writeMonthSection(ws, yearData.config.year, month, currentRow, locale) + 3;
  }

  styleHeader(ws, `A${currentRow}`, t.month);
  styleHeader(ws, `B${currentRow}`, t.startingBalance);
  styleHeader(ws, `C${currentRow}`, t.totalIncome);
  styleHeader(ws, `D${currentRow}`, t.totalExpenses);
  styleHeader(ws, `E${currentRow}`, t.savings);
  styleHeader(ws, `F${currentRow}`, t.endingBalance);

  yearData.months.forEach((month, index) => {
    const row = currentRow + 1 + index;
    ws.getCell(`A${row}`).value = formatExportMonthName(month.month, locale);
    money(ws, `B${row}`, month.startingBalance);
    money(ws, `C${row}`, month.totalIncome);
    money(ws, `D${row}`, month.totalExpenses);
    const savingsCell = ws.getCell(`E${row}`);
    savingsCell.value = month.savings;
    savingsCell.numFmt = "#,##0.00€";
    savingsCell.font = { color: { argb: month.savings >= 0 ? "FF1E8449" : "FFC0392B" } };
    money(ws, `F${row}`, month.endingBalance);
  });

  const configRow = currentRow + yearData.months.length + 2;
  styleHeader(ws, `A${configRow}`, t.configuration);

  const cfg = yearData.config;
  const cfgItems = [
    [t.estimatedSalary, cfg.estimatedSalary],
    [t.monthlyInvestment, cfg.monthlyInvestment],
    [t.monthlyHomeExpense, cfg.monthlyHomeExpense],
    [t.monthlyPersonalBudget, cfg.monthlyPersonalBudget],
    [t.interestRate, cfg.interestRate],
  ] as [string, number][];

  cfgItems.forEach(([text, value], index) => {
    ws.getCell(`A${configRow + 1 + index}`).value = text;
    money(ws, `B${configRow + 1 + index}`, value);
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}
