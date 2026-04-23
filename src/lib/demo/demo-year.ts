import type { AdditionalEntry, MonthData, YearConfig, YearData } from "../types";

export const DEMO_YEAR = 2026;
export const DEMO_MONTH = 4;

export function getDemoHref(): string {
  return `/demo/${DEMO_YEAR}/${DEMO_MONTH}`;
}

export function getDemoSummaryHref(): string {
  return `/demo/${DEMO_YEAR}/summary`;
}

export function getDemoYearData(): YearData {
  const config: YearConfig = {
    id: 0,
    year: DEMO_YEAR,
    startingBalance: 6400,
    estimatedSalary: 2450,
    monthlyInvestment: 350,
    monthlyHomeExpense: 980,
    monthlyPersonalBudget: 420,
    interestRate: 0.012,
  };

  const baseMonths: RawMonthData[] = Array.from({ length: 12 }, (_, index) => ({
    id: index + 1,
    yearId: config.id,
    ...estimatedMonthData(index + 1, config),
    additionalExpenses: [],
    additionalIncomes: [],
  }));

  baseMonths[0].additionalExpenses = [
    { id: 101, monthId: 1, type: "expense", label: "Seguro anual", amount: 320 },
  ];
  baseMonths[3].additionalIncomes = [
    { id: 401, monthId: 4, type: "income", label: "Devolucion IRPF", amount: 540 },
  ];
  baseMonths[6].bonus = 780;
  baseMonths[8].additionalExpenses = [
    { id: 901, monthId: 9, type: "expense", label: "Vacaciones", amount: 690 },
  ];

  return {
    config,
    months: computeMonthChain(baseMonths, config.startingBalance, config.interestRate),
  };
}

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
  interestsManualOverride: boolean;
  personalRemaining: number;
  additionalExpenses: AdditionalEntry[];
  additionalIncomes: AdditionalEntry[];
}

function estimatedMonthData(month: number, config: YearConfig): Omit<RawMonthData, "id" | "yearId"> {
  return {
    month,
    homeExpense: config.monthlyHomeExpense,
    personalExpense: config.monthlyPersonalBudget,
    investment: config.monthlyInvestment,
    payslip: config.estimatedSalary,
    additionalPayslip: month === 6 || month === 12 ? config.estimatedSalary : 0,
    bonus: 0,
    interests: 0,
    interestsManualOverride: false,
    personalRemaining: 0,
    additionalExpenses: [],
    additionalIncomes: [],
  };
}

function calculateMonthlyInterest(startingBalance: number, interestRate: number): number {
  return round2((startingBalance * interestRate) / 12);
}

function totalIncome(month: RawMonthData): number {
  const additionalSum = month.additionalIncomes.reduce((sum, entry) => sum + entry.amount, 0);
  return month.payslip + month.additionalPayslip + month.bonus + month.interests + month.personalRemaining + additionalSum;
}

function totalExpenses(month: RawMonthData): number {
  const additionalSum = month.additionalExpenses.reduce((sum, entry) => sum + entry.amount, 0);
  return month.homeExpense + month.personalExpense + month.investment + additionalSum;
}

function computeMonthChain(rawMonths: RawMonthData[], yearStartingBalance: number, interestRate = 0): MonthData[] {
  let runningBalance = yearStartingBalance;

  return [...rawMonths]
    .sort((left, right) => left.month - right.month)
    .map((month) => {
      const startingBalance = runningBalance;
      const interests = month.interestsManualOverride
        ? month.interests
        : calculateMonthlyInterest(startingBalance, interestRate);
      const monthWithInterest = { ...month, interests };
      const income = totalIncome(monthWithInterest);
      const expenses = totalExpenses(monthWithInterest);
      const savings = income - expenses;
      const endingBalance = startingBalance + savings;
      runningBalance = endingBalance;

      return {
        ...monthWithInterest,
        totalIncome: income,
        totalExpenses: expenses,
        savings,
        startingBalance,
        endingBalance,
      };
    });
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
