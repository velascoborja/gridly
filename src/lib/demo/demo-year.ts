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
    hasExtraPayments: true,
    estimatedExtraPayment: 2450,
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

  // Enero
  baseMonths[0].additionalExpenses = [
    { id: 101, monthId: 1, type: "expense", label: "Seguro anual", amount: 320 },
    { id: 102, monthId: 1, type: "expense", label: "Cena Reyes", amount: 85 },
  ];

  // Febrero
  baseMonths[1].additionalExpenses = [
    { id: 201, monthId: 2, type: "expense", label: "Regalo San Valentín", amount: 65 },
    { id: 202, monthId: 2, type: "expense", label: "Ajuste calefacción", amount: 45 },
  ];

  // Marzo
  baseMonths[2].additionalExpenses = [
    { id: 301, monthId: 3, type: "expense", label: "Escapada fin de semana", amount: 210 },
    { id: 302, monthId: 3, type: "expense", label: "Suscripción anual", amount: 99 },
  ];

  // Abril
  baseMonths[3].additionalExpenses = [
    { id: 402, monthId: 4, type: "expense", label: "Mantenimiento coche", amount: 120 },
    { id: 403, monthId: 4, type: "expense", label: "Cena amigos", amount: 55 },
  ];
  baseMonths[3].additionalIncomes = [
    { id: 401, monthId: 4, type: "income", label: "Devolución IRPF", amount: 540 },
    { id: 404, monthId: 4, type: "income", label: "Venta Wallapop", amount: 35 },
  ];

  // Mayo
  baseMonths[4].additionalExpenses = [
    { id: 501, monthId: 5, type: "expense", label: "Ropa temporada", amount: 145 },
  ];
  baseMonths[4].additionalIncomes = [
    { id: 502, monthId: 5, type: "income", label: "Regalo cumpleaños", amount: 100 },
  ];

  // Junio
  baseMonths[5].additionalExpenses = [
    { id: 601, monthId: 6, type: "expense", label: "Reserva vacaciones", amount: 450 },
  ];

  // Julio
  baseMonths[6].bonus = 780;
  baseMonths[6].additionalExpenses = [
    { id: 701, monthId: 7, type: "expense", label: "Vuelos verano", amount: 320 },
  ];

  // Agosto
  baseMonths[7].additionalExpenses = [
    { id: 801, monthId: 8, type: "expense", label: "Restaurantes playa", amount: 280 },
    { id: 802, monthId: 8, type: "expense", label: "Actividades ocio", amount: 150 },
  ];

  // Septiembre
  baseMonths[8].additionalExpenses = [
    { id: 901, monthId: 9, type: "expense", label: "Material oficina/estudios", amount: 85 },
    { id: 902, monthId: 9, type: "expense", label: "Suscripción gimnasio", amount: 45 },
  ];

  // Octubre
  baseMonths[9].additionalExpenses = [
    { id: 1001, monthId: 10, type: "expense", label: "Revisión dental", amount: 75 },
  ];

  // Noviembre
  baseMonths[10].additionalExpenses = [
    { id: 1101, monthId: 11, type: "expense", label: "Black Friday", amount: 215 },
  ];

  // Diciembre
  baseMonths[11].additionalExpenses = [
    { id: 1201, monthId: 12, type: "expense", label: "Regalos Navidad", amount: 480 },
    { id: 1202, monthId: 12, type: "expense", label: "Cena Nochebuena", amount: 120 },
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
    additionalPayslip:
      config.hasExtraPayments && (month === 6 || month === 12)
        ? config.estimatedExtraPayment
        : 0,
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
