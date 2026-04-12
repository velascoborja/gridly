import ExcelJS from "exceljs";
import type { YearData, MonthData } from "./types";
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

export async function buildWorkbook(yearData: YearData): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Gridly";

  // Month sheets
  for (const m of yearData.months) {
    const sheetName = MONTH_NAMES[m.month - 1];
    const ws = wb.addWorksheet(sheetName);
    ws.columns = [
      { width: 28 },
      { width: 14 },
      { width: 4 },
      { width: 28 },
      { width: 14 },
    ];

    // Title
    ws.mergeCells("A1:E1");
    const title = ws.getCell("A1");
    title.value = `${sheetName} ${yearData.config.year}`;
    title.font = { bold: true, size: 13 };
    title.alignment = { horizontal: "center" };

    // Headers row 3
    styleHeader(ws, "A3", "GASTOS");
    styleHeader(ws, "D3", "INGRESOS");

    let expRow = 4;
    const addExpRow = (lbl: string, val: number) => {
      label(ws, `A${expRow}`, lbl);
      money(ws, `B${expRow}`, val);
      expRow++;
    };

    addExpRow("Casa (mes siguiente)", m.homeExpense);
    addExpRow("Gastos propios", m.personalExpense);
    addExpRow("Inversión", m.investment);
    for (const e of m.additionalExpenses) {
      addExpRow(e.label, e.amount);
    }

    let incRow = 4;
    const addIncRow = (lbl: string, val: number) => {
      label(ws, `D${incRow}`, lbl);
      money(ws, `E${incRow}`, val);
      incRow++;
    };

    addIncRow("Nómina", m.payslip);
    if (m.additionalPayslip > 0) addIncRow("Paga extra", m.additionalPayslip);
    if (m.bonus > 0) addIncRow("Bonus", m.bonus);
    addIncRow("Intereses", m.interests);
    addIncRow("Sobrante propios", m.personalRemaining);
    for (const e of m.additionalIncomes) {
      addIncRow(e.label, e.amount);
    }

    // Totals
    const totalRow = Math.max(expRow, incRow) + 1;
    styleHeader(ws, `A${totalRow}`, "Total gastos");
    money(ws, `B${totalRow}`, m.totalExpenses);
    styleHeader(ws, `D${totalRow}`, "Total ingresos");
    money(ws, `E${totalRow}`, m.totalIncome);

    // Summary block
    const sumRow = totalRow + 2;
    label(ws, `A${sumRow}`, "Saldo inicial");
    money(ws, `B${sumRow}`, m.startingBalance);

    label(ws, `A${sumRow + 1}`, "Ahorro del mes");
    const savingsCell = ws.getCell(`B${sumRow + 1}`);
    savingsCell.value = m.savings;
    savingsCell.numFmt = "#,##0.00€";
    savingsCell.font = { color: { argb: m.savings >= 0 ? "FF1E8449" : "FFC0392B" } };

    label(ws, `A${sumRow + 2}`, "Saldo final");
    const endCell = ws.getCell(`B${sumRow + 2}`);
    endCell.value = m.endingBalance;
    endCell.numFmt = "#,##0.00€";
    endCell.font = { bold: true };
  }

  // Annual summary sheet
  const ws = wb.addWorksheet("Resumen Anual");
  ws.columns = [{ width: 16 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 14 }];

  styleHeader(ws, "A1", "Mes");
  styleHeader(ws, "B1", "Saldo inicial");
  styleHeader(ws, "C1", "Ingresos");
  styleHeader(ws, "D1", "Gastos");
  styleHeader(ws, "E1", "Ahorro");
  styleHeader(ws, "F1", "Saldo final");

  yearData.months.forEach((m, i) => {
    const r = i + 2;
    ws.getCell(`A${r}`).value = MONTH_NAMES[m.month - 1];
    money(ws, `B${r}`, m.startingBalance);
    money(ws, `C${r}`, m.totalIncome);
    money(ws, `D${r}`, m.totalExpenses);
    const sc = ws.getCell(`E${r}`);
    sc.value = m.savings;
    sc.numFmt = "#,##0.00€";
    sc.font = { color: { argb: m.savings >= 0 ? "FF1E8449" : "FFC0392B" } };
    money(ws, `F${r}`, m.endingBalance);
  });

  // Config block
  const configRow = 15;
  styleHeader(ws, `A${configRow}`, "Configuración");
  const cfg = yearData.config;
  const cfgItems = [
    ["Salario estimado", cfg.estimatedSalary],
    ["Inversión mensual", cfg.monthlyInvestment],
    ["Gasto hogar mensual", cfg.monthlyHomeExpense],
    ["Presupuesto personal", cfg.monthlyPersonalBudget],
    ["Tipo interés", cfg.interestRate],
  ] as [string, number][];

  cfgItems.forEach(([lbl, val], i) => {
    ws.getCell(`A${configRow + 1 + i}`).value = lbl;
    money(ws, `B${configRow + 1 + i}`, val);
  });

  const buf = await wb.xlsx.writeBuffer();
  return Buffer.from(buf as ArrayBuffer);
}
