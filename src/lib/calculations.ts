import type { AdditionalEntry, AdditionalEntryGroup, MonthData, RecurringExpense, YearConfig } from "./types";

interface RawMonthData {
  id: number;
  yearId: number;
  month: number;
  homeExpense: number;
  homeExpenseManualOverride?: boolean;
  personalExpense: number;
  personalExpenseManualOverride?: boolean;
  investment: number;
  investmentManualOverride?: boolean;
  payslip: number;
  payslipManualOverride?: boolean;
  additionalPayslip: number;
  additionalPayslipManualOverride?: boolean;
  interests: number;
  interestsManualOverride: boolean;
  personalRemaining: number;
  recurringExpenses?: RecurringExpense[];
  additionalExpenses: AdditionalEntry[];        // ungrouped only
  additionalExpenseGroups: AdditionalEntryGroup[]; // grouped
  additionalIncomes: AdditionalEntry[];
}

export interface AggregatedMonthFinancialInput {
  startingBalance: number;
  interestRate: number;
  interests: number;
  interestsManualOverride: boolean;
  payslip: number;
  additionalPayslip: number;
  personalRemaining: number;
  homeExpense: number;
  personalExpense: number;
  investment: number;
  additionalIncome: number;
  additionalExpense: number;
  recurringExpense: number;
}

export function calculateMonthlyInterest(startingBalance: number, interestRate: number): number {
  return round2((startingBalance * interestRate) / 12);
}

export function totalIncome(m: RawMonthData): number {
  const additionalSum = m.additionalIncomes.reduce((sum, e) => sum + e.amount, 0);
  return m.payslip + m.additionalPayslip + m.interests + m.personalRemaining + additionalSum;
}

export function totalExpenses(m: RawMonthData): number {
  const additionalSum = m.additionalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const groupedSum = m.additionalExpenseGroups.reduce(
    (sum, g) => sum + g.entries.reduce((s, e) => s + e.amount, 0),
    0
  );
  const recurringSum = (m.recurringExpenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  return m.homeExpense + m.personalExpense + m.investment + recurringSum + additionalSum + groupedSum;
}

export function savings(m: RawMonthData): number {
  return totalIncome(m) - totalExpenses(m);
}

export function calculateMonthFinancials(input: AggregatedMonthFinancialInput) {
  const interests = input.interestsManualOverride
    ? input.interests
    : calculateMonthlyInterest(input.startingBalance, input.interestRate);
  const income = input.payslip + input.additionalPayslip + interests + input.personalRemaining + input.additionalIncome;
  const expenses = input.homeExpense + input.personalExpense + input.investment + input.recurringExpense + input.additionalExpense;
  const monthSavings = income - expenses;

  return {
    interests,
    totalIncome: income,
    totalExpenses: expenses,
    savings: monthSavings,
    endingBalance: input.startingBalance + monthSavings,
  };
}

export function computeMonthChain(
  rawMonths: RawMonthData[],
  yearStartingBalance: number,
  interestRate = 0
): MonthData[] {
  // Sort by month number
  const sorted = [...rawMonths].sort((a, b) => a.month - b.month);

  let runningBalance = yearStartingBalance;
  return sorted.map((m) => {
    const startingBalance = runningBalance;
    const additionalIncome = m.additionalIncomes.reduce((sum, entry) => sum + entry.amount, 0);
    const additionalExpense =
      m.additionalExpenses.reduce((sum, entry) => sum + entry.amount, 0) +
      m.additionalExpenseGroups.reduce(
        (sum, group) => sum + group.entries.reduce((groupSum, entry) => groupSum + entry.amount, 0),
        0
      );
    const recurringExpense = (m.recurringExpenses ?? []).reduce((sum, entry) => sum + entry.amount, 0);
    const financials = calculateMonthFinancials({
      startingBalance,
      interestRate,
      interests: m.interests,
      interestsManualOverride: m.interestsManualOverride,
      payslip: m.payslip,
      additionalPayslip: m.additionalPayslip,
      personalRemaining: m.personalRemaining,
      homeExpense: m.homeExpense,
      personalExpense: m.personalExpense,
      investment: m.investment,
      additionalIncome,
      additionalExpense,
      recurringExpense,
    });
    runningBalance = financials.endingBalance;

    return {
      ...m,
      interests: financials.interests,
      recurringExpenses: m.recurringExpenses ?? [],
      homeExpenseManualOverride: Boolean(m.homeExpenseManualOverride),
      personalExpenseManualOverride: Boolean(m.personalExpenseManualOverride),
      investmentManualOverride: Boolean(m.investmentManualOverride),
      payslipManualOverride: Boolean(m.payslipManualOverride),
      additionalPayslipManualOverride: Boolean(m.additionalPayslipManualOverride),
      totalIncome: financials.totalIncome,
      totalExpenses: financials.totalExpenses,
      savings: financials.savings,
      startingBalance,
      endingBalance: financials.endingBalance,
    };
  });
}

export function estimatedMonthData(month: number, config: YearConfig): Omit<RawMonthData, "id" | "yearId"> {
  const isExtraPaymentMonth = month === 6 || month === 12;

  return {
    month,
    homeExpense: config.monthlyHomeExpense,
    homeExpenseManualOverride: false,
    personalExpense: config.monthlyPersonalBudget,
    personalExpenseManualOverride: false,
    investment: config.monthlyInvestment,
    investmentManualOverride: false,
    payslip: config.estimatedSalary,
    payslipManualOverride: false,
    additionalPayslip: config.hasExtraPayments && isExtraPaymentMonth ? config.estimatedExtraPayment : 0,
    additionalPayslipManualOverride: false,
    interests: 0,
    interestsManualOverride: false,
    personalRemaining: 0,
    recurringExpenses: [],
    additionalExpenses: [],
    additionalExpenseGroups: [],
    additionalIncomes: [],
  };
}

export function applyYearConfigToMonth<T extends RawMonthData>(month: T, config: YearConfig, applyFromMonth = 1): T {
  if (month.month < applyFromMonth) {
    return month;
  }

  const isExtraPaymentMonth = month.month === 6 || month.month === 12;

  return {
    ...month,
    homeExpense: config.monthlyHomeExpense,
    homeExpenseManualOverride: false,
    personalExpense: config.monthlyPersonalBudget,
    personalExpenseManualOverride: false,
    investment: config.monthlyInvestment,
    investmentManualOverride: false,
    payslip: config.estimatedSalary,
    payslipManualOverride: false,
    additionalPayslip: config.hasExtraPayments && isExtraPaymentMonth ? config.estimatedExtraPayment : 0,
    additionalPayslipManualOverride: false,
    interests: 0,
    interestsManualOverride: false,
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
