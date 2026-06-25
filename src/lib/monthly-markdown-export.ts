import type { MonthData, YearData } from "./types";
import { formatMonthName } from "./utils";

const MONTHLY_MARKDOWN_MESSAGES = {
  en: {
    nextMonthExpenses: "Next month expenses",
    fixedExpenses: "Fixed expenses",
    currentMonthExpenses: "Current month expenses",
    income: "Income",
    fixedIncome: "Fixed income",
    additionalIncome: "Additional income",
    current: "Current",
    household: "Home",
    personalExpense: "Personal",
    investment: "Investment",
    payslip: "Salary",
    interests: "Interests",
    personalRemaining: "Revolut",
    additionalPayslip: "Extra pay",
    totalIncome: "Income",
    totalExpenses: "Expenses",
    savings: "Savings",
    endingBalance: "Final",
    conceptHeader: "Concept",
    amountHeader: "Amount",
  },
  es: {
    nextMonthExpenses: "Gastos mes siguiente",
    fixedExpenses: "Gastos fijos",
    currentMonthExpenses: "Gastos mes actual",
    income: "Ingreso",
    fixedIncome: "Ingresos fijos",
    additionalIncome: "Ingresos adicionales",
    current: "Actual",
    household: "Casa",
    personalExpense: "Propios",
    investment: "Inversión",
    payslip: "Nómina",
    interests: "Intereses",
    personalRemaining: "Revolut",
    additionalPayslip: "Paga extra",
    totalIncome: "Ingresos",
    totalExpenses: "Gastos",
    savings: "Ahorro",
    endingBalance: "Final",
    conceptHeader: "Concepto",
    amountHeader: "Importe",
  },
} as const;

type Locale = keyof typeof MONTHLY_MARKDOWN_MESSAGES;

function escapeMarkdownTableText(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/\|/g, "\\|").replace(/\n/g, " ");
}

function formatMoney(value: number, locale: Locale) {
  return new Intl.NumberFormat(locale === "en" ? "en-US" : "es-ES", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function moneyTable(rows: Array<[string, number]>, locale: Locale) {
  const t = MONTHLY_MARKDOWN_MESSAGES[locale];
  const lines = [`| ${t.conceptHeader} | ${t.amountHeader} |`, "|---|---:|"];
  for (const [label, amount] of sortMoneyRowsDesc(rows)) {
    lines.push(`| ${escapeMarkdownTableText(label)} | ${formatMoney(amount, locale)} |`);
  }
  return lines.join("\n");
}

function sortMoneyRowsDesc(rows: Array<[string, number]>) {
  return [...rows].sort((a, b) => b[1] - a[1]);
}

function currentExpenseRows(month: MonthData): Array<[string, number]> {
  const rows: Array<[string, number]> = month.additionalExpenses.map((entry) => [entry.label, entry.amount]);

  for (const group of month.additionalExpenseGroups) {
    for (const entry of group.entries) {
      rows.push([`${group.label} - ${entry.label}`, entry.amount]);
    }
  }

  return rows;
}

export function buildMonthlyMarkdown(yearData: YearData, monthNumber: number, locale: Locale = "es") {
  const month = yearData.months.find((item) => item.month === monthNumber);
  if (!month) {
    throw new Error(`Month ${monthNumber} not found`);
  }

  const t = MONTHLY_MARKDOWN_MESSAGES[locale];
  const monthName = formatMonthName(month.month, locale);
  const title = `${monthName.charAt(0).toLocaleUpperCase(locale)}${monthName.slice(1)} ${yearData.config.year}`;
  const recurringExpenseRows = month.recurringExpenses.map((entry) => [entry.label, entry.amount] as [string, number]);
  const additionalIncomeRows = month.additionalIncomes.map((entry) => [entry.label, entry.amount] as [string, number]);

  return [
    `# ${title}`,
    "",
    `## ${t.nextMonthExpenses}`,
    "",
    moneyTable([[t.household, month.homeExpense]], locale),
    "",
    `## ${t.fixedExpenses}`,
    "",
    moneyTable([
      [t.personalExpense, month.personalExpense],
      [t.investment, month.investment],
      ...recurringExpenseRows,
    ], locale),
    "",
    `## ${t.currentMonthExpenses}`,
    "",
    moneyTable(currentExpenseRows(month), locale),
    "",
    `## ${t.income}`,
    "",
    `### ${t.fixedIncome}`,
    "",
    moneyTable([
      [t.payslip, month.payslip],
      [t.interests, month.interests],
      [t.personalRemaining, month.personalRemaining],
    ], locale),
    "",
    `### ${t.additionalIncome}`,
    "",
    moneyTable([
      [t.additionalPayslip, month.additionalPayslip],
      ...additionalIncomeRows,
    ], locale),
    "",
    `## ${t.current}`,
    "",
    moneyTable([
      [t.current, month.startingBalance],
      [t.totalIncome, month.totalIncome],
      [t.totalExpenses, month.totalExpenses],
      [t.savings, month.savings],
      [t.endingBalance, month.endingBalance],
    ], locale),
    "",
  ].join("\n");
}
