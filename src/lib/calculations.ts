import type { AdditionalEntry, MonthData, RecurringExpense, YearConfig } from "./types";

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
  additionalExpenses: AdditionalEntry[];
  additionalIncomes: AdditionalEntry[];
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
  const recurringSum = (m.recurringExpenses ?? []).reduce((sum, e) => sum + e.amount, 0);
  return m.homeExpense + m.personalExpense + m.investment + recurringSum + additionalSum;
}

export function savings(m: RawMonthData): number {
  return totalIncome(m) - totalExpenses(m);
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
    const interests = m.interestsManualOverride
      ? m.interests
      : calculateMonthlyInterest(startingBalance, interestRate);
    const monthWithInterest = {
      ...m,
      interests,
      recurringExpenses: m.recurringExpenses ?? [],
    };
    const income = totalIncome(monthWithInterest);
    const expenses = totalExpenses(monthWithInterest);
    const monthSavings = income - expenses;
    const endingBalance = startingBalance + monthSavings;
    runningBalance = endingBalance;

    return {
      ...monthWithInterest,
      homeExpenseManualOverride: Boolean(m.homeExpenseManualOverride),
      personalExpenseManualOverride: Boolean(m.personalExpenseManualOverride),
      investmentManualOverride: Boolean(m.investmentManualOverride),
      payslipManualOverride: Boolean(m.payslipManualOverride),
      additionalPayslipManualOverride: Boolean(m.additionalPayslipManualOverride),
      totalIncome: income,
      totalExpenses: expenses,
      savings: monthSavings,
      startingBalance,
      endingBalance,
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
