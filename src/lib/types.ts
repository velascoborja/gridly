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

export interface Tag {
  id: number;
  name: string;
  color: string;
}

export interface AdditionalEntry {
  id: number;
  monthId: number;
  type: "income" | "expense";
  label: string;
  amount: number;
  isRecurring: boolean;
  tagId: number | null;
  tag: Tag | null;
}

export interface AdditionalEntryGroup {
  id: number;
  monthId: number;
  label: string;
  tagId: number | null;
  tag: Tag | null;
  entries: AdditionalEntry[];
}

export interface YearRecurringExpense {
  id: number;
  yearId: number;
  label: string;
  amount: number;
  sortOrder: number;
  tagId: number | null;
}

export interface RecurringExpense {
  id: number;
  monthId: number;
  yearRecurringExpenseId: number | null;
  label: string;
  amount: number;
  sortOrder: number;
  tagId: number | null;
  tag: Tag | null;
}

export interface MonthData {
  id: number;
  yearId: number;
  month: number;
  homeExpense: number;
  homeExpenseManualOverride: boolean;
  personalExpense: number;
  personalExpenseManualOverride: boolean;
  investment: number;
  investmentManualOverride: boolean;
  payslip: number;
  payslipManualOverride: boolean;
  additionalPayslip: number;
  additionalPayslipManualOverride: boolean;
  interests: number;
  interestsManualOverride: boolean;
  personalRemaining: number;
  recurringExpenses: RecurringExpense[];
  additionalExpenses: AdditionalEntry[];           // ungrouped expenses only
  additionalExpenseGroups: AdditionalEntryGroup[]; // grouped expenses
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

export interface HistoricalYear {
  id: number;
  userId: string;
  year: number;
  startingBalance: number;
  finalBalance: number;
  investedAmount: number;
  savingsRate: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface HistoricalYearInput {
  year: number;
  startingBalance: number;
  finalBalance: number;
  investedAmount: number;
  savingsRate: number | null;
}

export interface YearOption {
  year: number;
  source: "gridly" | "historical";
}
