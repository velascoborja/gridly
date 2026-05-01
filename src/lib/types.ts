export interface YearConfig {
  id: number;
  year: number;
  startingBalance: number;
  estimatedSalary: number;
  hasExtraPayments: boolean;
  estimatedExtraPayment: number;
  monthlyInvestment: number;
  monthlyHomeExpense: number;
  monthlyPersonalBudget: number;
  interestRate: number;
}

export interface AdditionalEntry {
  id: number;
  monthId: number;
  type: "income" | "expense";
  label: string;
  amount: number;
}

export interface YearRecurringExpense {
  id: number;
  yearId: number;
  label: string;
  amount: number;
  sortOrder: number;
}

export interface RecurringExpense {
  id: number;
  monthId: number;
  yearRecurringExpenseId: number | null;
  label: string;
  amount: number;
  sortOrder: number;
}

export interface MonthData {
  id: number;
  yearId: number;
  month: number;
  homeExpense: number;
  personalExpense: number;
  investment: number;
  payslip: number;
  additionalPayslip: number;
  interests: number;
  interestsManualOverride: boolean;
  personalRemaining: number;
  recurringExpenses: RecurringExpense[];
  additionalExpenses: AdditionalEntry[];
  additionalIncomes: AdditionalEntry[];
  // computed
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  startingBalance: number;
  endingBalance: number;
}

export interface YearData {
  config: YearConfig;
  recurringExpenses: YearRecurringExpense[];
  months: MonthData[];
}
