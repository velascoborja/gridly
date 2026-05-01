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

function formatExportMonthName(month: number, locale: "en" | "es") {
  const name = formatMonthName(month, locale);
  return name.charAt(0).toLocaleUpperCase(locale) + name.slice(1);
}

function writeMonthSection(
  ws: ExcelJS.Worksheet,
  year: number,
  month: YearData["months"][number],
  startRow: number,
  locale: "en" | "es",
) {
  const t = EXPORT_MESSAGES[locale];
  const sheetName = formatExportMonthName(month.month, locale);

  ws.mergeCells(`A${startRow}:E${startRow}`);
  const title = ws.getCell(`A${startRow}`);
  title.value = `${sheetName} ${year}`;
  title.font = { bold: true, size: 13 };
  title.alignment = { horizontal: "center" };

  const headerRow = startRow + 2;
  styleHeader(ws, `A${headerRow}`, t.expenses);
  styleHeader(ws, `D${headerRow}`, t.income);

  let expRow = headerRow + 1;
  const addExpRow = (text: string, value: number) => {
    label(ws, `A${expRow}`, text);
    money(ws, `B${expRow}`, value);
    expRow++;
  };

  addExpRow(t.homeExpense, month.homeExpense);
  addExpRow(t.personalExpense, month.personalExpense);
  addExpRow(t.investment, month.investment);
  for (const entry of month.recurringExpenses ?? []) {
    addExpRow(entry.label, entry.amount);
  }
  for (const entry of month.additionalExpenses) {
    addExpRow(entry.label, entry.amount);
  }

  let incRow = headerRow + 1;
  const addIncRow = (text: string, value: number) => {
    label(ws, `D${incRow}`, text);
    money(ws, `E${incRow}`, value);
    incRow++;
  };

  addIncRow(t.payslip, month.payslip);
  if (month.additionalPayslip > 0) addIncRow(t.additionalPayslip, month.additionalPayslip);
  addIncRow(t.interests, month.interests);
  addIncRow(t.personalRemaining, month.personalRemaining);
  for (const entry of month.additionalIncomes) {
    addIncRow(entry.label, entry.amount);
  }

  const totalRow = Math.max(expRow, incRow) + 1;
  styleHeader(ws, `A${totalRow}`, t.totalExpenses);
  money(ws, `B${totalRow}`, month.totalExpenses);
  styleHeader(ws, `D${totalRow}`, t.totalIncome);
  money(ws, `E${totalRow}`, month.totalIncome);

  const summaryRow = totalRow + 2;
  label(ws, `A${summaryRow}`, t.startingBalance);
  money(ws, `B${summaryRow}`, month.startingBalance);

  label(ws, `A${summaryRow + 1}`, t.savings);
  const savingsCell = ws.getCell(`B${summaryRow + 1}`);
  savingsCell.value = month.savings;
  savingsCell.numFmt = "#,##0.00€";
  savingsCell.font = { color: { argb: month.savings >= 0 ? "FF1E8449" : "FFC0392B" } };

  label(ws, `A${summaryRow + 2}`, t.endingBalance);
  const endCell = ws.getCell(`B${summaryRow + 2}`);
  endCell.value = month.endingBalance;
  endCell.numFmt = "#,##0.00€";
  endCell.font = { bold: true };

  return summaryRow + 2;
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
