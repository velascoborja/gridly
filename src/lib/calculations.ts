import type { AdditionalEntry, MonthData, YearConfig } from "./types";

interface RawMonthData {
  id: number;
  yearId: number;
  month: number;
  homeExpense: number;
  personalExpense: number;
  investment: number;
  payslip: number;
  additionalPayslip: number;
  bonus: number;
  interests: number;
  personalRemaining: number;
  additionalExpenses: AdditionalEntry[];
  additionalIncomes: AdditionalEntry[];
}

export function totalIncome(m: RawMonthData): number {
  const additionalSum = m.additionalIncomes.reduce((sum, e) => sum + e.amount, 0);
  return m.payslip + m.additionalPayslip + m.bonus + m.interests + m.personalRemaining + additionalSum;
}

export function totalExpenses(m: RawMonthData): number {
  const additionalSum = m.additionalExpenses.reduce((sum, e) => sum + e.amount, 0);
  return m.homeExpense + m.personalExpense + m.investment + additionalSum;
}

export function savings(m: RawMonthData): number {
  return totalIncome(m) - totalExpenses(m);
}

export function computeMonthChain(rawMonths: RawMonthData[], yearStartingBalance: number): MonthData[] {
  // Sort by month number
  const sorted = [...rawMonths].sort((a, b) => a.month - b.month);

  let runningBalance = yearStartingBalance;
  return sorted.map((m) => {
    const income = totalIncome(m);
    const expenses = totalExpenses(m);
    const monthSavings = income - expenses;
    const startingBalance = runningBalance;
    const endingBalance = startingBalance + monthSavings;
    runningBalance = endingBalance;

    return {
      ...m,
      totalIncome: income,
      totalExpenses: expenses,
      savings: monthSavings,
      startingBalance,
      endingBalance,
    };
  });
}

export function estimatedMonthData(month: number, config: YearConfig): Omit<RawMonthData, "id" | "yearId"> {
  return {
    month,
    homeExpense: config.monthlyHomeExpense,
    personalExpense: config.monthlyPersonalBudget,
    investment: config.monthlyInvestment,
    payslip: config.estimatedSalary,
    // June = 6, December = 12 get additional payslip
    additionalPayslip: month === 6 || month === 12 ? config.estimatedSalary : 0,
    // July = 7 gets bonus (set to 0 — user fills in actual)
    bonus: 0,
    // Estimate monthly interest: annual rate * balance / 12 — simplified, user updates actual
    interests: 0,
    personalRemaining: 0,
    additionalExpenses: [],
    additionalIncomes: [],
  };
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
