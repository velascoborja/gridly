import ExcelJS from "exceljs";
import type { YearData } from "./types";
import { MONTH_NAMES } from "./utils";

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

function writeMonthSection(
  ws: ExcelJS.Worksheet,
  year: number,
  month: YearData["months"][number],
  startRow: number,
) {
  const sheetName = MONTH_NAMES[month.month - 1];

  ws.mergeCells(`A${startRow}:E${startRow}`);
  const title = ws.getCell(`A${startRow}`);
  title.value = `${sheetName} ${year}`;
  title.font = { bold: true, size: 13 };
  title.alignment = { horizontal: "center" };

  const headerRow = startRow + 2;
  styleHeader(ws, `A${headerRow}`, "GASTOS");
  styleHeader(ws, `D${headerRow}`, "INGRESOS");

  let expRow = headerRow + 1;
  const addExpRow = (text: string, value: number) => {
    label(ws, `A${expRow}`, text);
    money(ws, `B${expRow}`, value);
    expRow++;
  };

  addExpRow("Casa (mes siguiente)", month.homeExpense);
  addExpRow("Gastos propios", month.personalExpense);
  addExpRow("Inversión", month.investment);
  for (const entry of month.additionalExpenses) {
    addExpRow(entry.label, entry.amount);
  }

  let incRow = headerRow + 1;
  const addIncRow = (text: string, value: number) => {
    label(ws, `D${incRow}`, text);
    money(ws, `E${incRow}`, value);
    incRow++;
  };

  addIncRow("Nómina", month.payslip);
  if (month.additionalPayslip > 0) addIncRow("Paga extra", month.additionalPayslip);
  if (month.bonus > 0) addIncRow("Bonus", month.bonus);
  addIncRow("Intereses", month.interests);
  addIncRow("Sobrante propios", month.personalRemaining);
  for (const entry of month.additionalIncomes) {
    addIncRow(entry.label, entry.amount);
  }

  const totalRow = Math.max(expRow, incRow) + 1;
  styleHeader(ws, `A${totalRow}`, "Total gastos");
  money(ws, `B${totalRow}`, month.totalExpenses);
  styleHeader(ws, `D${totalRow}`, "Total ingresos");
  money(ws, `E${totalRow}`, month.totalIncome);

  const summaryRow = totalRow + 2;
  label(ws, `A${summaryRow}`, "Saldo inicial");
  money(ws, `B${summaryRow}`, month.startingBalance);

  label(ws, `A${summaryRow + 1}`, "Ahorro del mes");
  const savingsCell = ws.getCell(`B${summaryRow + 1}`);
  savingsCell.value = month.savings;
  savingsCell.numFmt = "#,##0.00€";
  savingsCell.font = { color: { argb: month.savings >= 0 ? "FF1E8449" : "FFC0392B" } };

  label(ws, `A${summaryRow + 2}`, "Saldo final");
  const endCell = ws.getCell(`B${summaryRow + 2}`);
  endCell.value = month.endingBalance;
  endCell.numFmt = "#,##0.00€";
  endCell.font = { bold: true };

  return summaryRow + 2;
}

export async function buildWorkbook(yearData: YearData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gridly";

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
    currentRow = writeMonthSection(ws, yearData.config.year, month, currentRow) + 3;
  }

  styleHeader(ws, `A${currentRow}`, "Mes");
  styleHeader(ws, `B${currentRow}`, "Saldo inicial");
  styleHeader(ws, `C${currentRow}`, "Ingresos");
  styleHeader(ws, `D${currentRow}`, "Gastos");
  styleHeader(ws, `E${currentRow}`, "Ahorro");
  styleHeader(ws, `F${currentRow}`, "Saldo final");

  yearData.months.forEach((month, index) => {
    const row = currentRow + 1 + index;
    ws.getCell(`A${row}`).value = MONTH_NAMES[month.month - 1];
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
  styleHeader(ws, `A${configRow}`, "Configuración");

  const cfg = yearData.config;
  const cfgItems = [
    ["Salario estimado", cfg.estimatedSalary],
    ["Inversión mensual", cfg.monthlyInvestment],
    ["Gasto hogar mensual", cfg.monthlyHomeExpense],
    ["Presupuesto personal", cfg.monthlyPersonalBudget],
    ["Tipo interés", cfg.interestRate],
  ] as [string, number][];

  cfgItems.forEach(([text, value], index) => {
    ws.getCell(`A${configRow + 1 + index}`).value = text;
    money(ws, `B${configRow + 1 + index}`, value);
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}
