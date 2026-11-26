import type { EvolutionYearMetric } from "./evolution";
import type { AdditionalEntry, MonthData, YearData } from "./types";
import { round2, totalMonthlyInvestment } from "./calculations.ts";

export type McpEntryKind = "additional" | "recurring";

export interface McpEntry {
  id: number;
  year: number;
  month: number;
  type: "income" | "expense";
  kind: McpEntryKind;
  label: string;
  amount: number;
  tag: string | null;
  group: string | null;
  isInvestment: boolean;
  isRecurring: boolean;
  isCompleted: boolean;
}

export interface McpEntryFilter {
  month?: number;
  type?: "income" | "expense";
  tag?: string;
  search?: string;
}

function additionalEntryToMcp(
  year: number,
  month: number,
  entry: AdditionalEntry,
  group: string | null
): McpEntry {
  return {
    id: entry.id,
    year,
    month,
    type: entry.type,
    kind: "additional",
    label: entry.label,
    amount: round2(entry.amount),
    tag: entry.tag?.name ?? null,
    group,
    isInvestment: entry.isInvestment === true,
    isRecurring: entry.isRecurring,
    isCompleted: entry.isCompleted === true,
  };
}

export function monthEntries(year: number, month: MonthData): McpEntry[] {
  return [
    ...month.additionalIncomes.map((entry) => additionalEntryToMcp(year, month.month, entry, null)),
    ...month.additionalExpenses.map((entry) => additionalEntryToMcp(year, month.month, entry, null)),
    ...month.additionalExpenseGroups.flatMap((group) =>
      group.entries.map((entry) =>
        additionalEntryToMcp(year, month.month, { ...entry, tag: entry.tag ?? group.tag ?? null }, group.label)
      )
    ),
    ...month.recurringExpenses.map((entry): McpEntry => ({
      id: entry.id,
      year,
      month: month.month,
      type: "expense",
      kind: "recurring",
      label: entry.label,
      amount: round2(entry.amount),
      tag: entry.tag?.name ?? null,
      group: null,
      isInvestment: false,
      isRecurring: true,
      isCompleted: false,
    })),
  ];
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLocaleLowerCase("es-ES").trim();
}

export function filterYearEntries(yearData: YearData, filter: McpEntryFilter = {}): McpEntry[] {
  const tag = filter.tag ? normalize(filter.tag) : null;
  const search = filter.search ? normalize(filter.search) : null;

  return yearData.months
    .filter((month) => filter.month === undefined || month.month === filter.month)
    .flatMap((month) => monthEntries(yearData.config.year, month))
    .filter((entry) => filter.type === undefined || entry.type === filter.type)
    .filter((entry) => tag === null || (entry.tag !== null && normalize(entry.tag) === tag))
    .filter(
      (entry) =>
        search === null ||
        normalize(entry.label).includes(search) ||
        (entry.group !== null && normalize(entry.group).includes(search))
    );
}

export function sumEntries(entries: McpEntry[]) {
  const income = entries.filter((e) => e.type === "income").reduce((sum, e) => sum + e.amount, 0);
  const expense = entries.filter((e) => e.type === "expense").reduce((sum, e) => sum + e.amount, 0);
  return { income: round2(income), expense: round2(expense), count: entries.length };
}

export function describeMonth(year: number, month: MonthData) {
  return {
    year,
    month: month.month,
    startingBalance: round2(month.startingBalance),
    endingBalance: round2(month.endingBalance),
    totalIncome: round2(month.totalIncome),
    totalExpenses: round2(month.totalExpenses),
    savings: round2(month.savings),
    income: {
      payslip: round2(month.payslip),
      additionalPayslip: round2(month.additionalPayslip),
      interests: round2(month.interests),
    },
    fixedExpenses: {
      home: round2(month.homeExpense),
      personalBudget: round2(month.personalExpense),
      personalBudgetRemaining: round2(month.personalRemaining),
      investment: round2(month.investment),
    },
    totalInvestment: round2(totalMonthlyInvestment(month)),
    entries: monthEntries(year, month),
  };
}

export function summarizeYear(yearData: YearData) {
  const { config, months } = yearData;
  const totalIncome = months.reduce((sum, m) => sum + m.totalIncome, 0);
  const totalExpenses = months.reduce((sum, m) => sum + m.totalExpenses, 0);
  const investedAmount = months.reduce((sum, m) => sum + totalMonthlyInvestment(m), 0);
  const interestsEarned = months.reduce((sum, m) => sum + m.interests, 0);
  const lastMonth = months.at(-1);
  const finalBalance = lastMonth ? lastMonth.endingBalance : config.startingBalance;
  const savedAmount = finalBalance - config.startingBalance;

  return {
    year: config.year,
    config: {
      startingBalance: round2(config.startingBalance),
      estimatedSalary: round2(config.estimatedSalary),
      hasExtraPayments: config.hasExtraPayments,
      estimatedExtraPayment: round2(config.estimatedExtraPayment),
      monthlyInvestment: round2(config.monthlyInvestment),
      monthlyHomeExpense: round2(config.monthlyHomeExpense),
      monthlyPersonalBudget: round2(config.monthlyPersonalBudget),
      annualInterestRate: config.interestRate,
    },
    totals: {
      startingBalance: round2(config.startingBalance),
      finalBalance: round2(finalBalance),
      totalIncome: round2(totalIncome),
      totalExpenses: round2(totalExpenses),
      savedAmount: round2(savedAmount),
      savingsRate: totalIncome > 0 ? Number((savedAmount / totalIncome).toFixed(4)) : null,
      investedAmount: round2(investedAmount),
      interestsEarned: round2(interestsEarned),
    },
    months: months.map((m) => ({
      month: m.month,
      totalIncome: round2(m.totalIncome),
      totalExpenses: round2(m.totalExpenses),
      savings: round2(m.savings),
      endingBalance: round2(m.endingBalance),
    })),
  };
}

export function describeEvolutionMetric(metric: EvolutionYearMetric) {
  return {
    year: metric.year,
    source: metric.source,
    startingBalance: round2(metric.startingBalance),
    finalBalance: round2(metric.finalBalance),
    savedAmount: round2(metric.savedAmount),
    investedAmount: round2(metric.investedAmount),
    accumulatedInvested: round2(metric.accumulatedInvested),
    interestsEarned: round2(metric.interestsEarned),
    totalIncome: metric.totalIncome === null ? null : round2(metric.totalIncome),
    totalExpenses: metric.totalExpenses === null ? null : round2(metric.totalExpenses),
    savingsRate: metric.savingsRate === null ? null : Number(metric.savingsRate.toFixed(4)),
  };
}
