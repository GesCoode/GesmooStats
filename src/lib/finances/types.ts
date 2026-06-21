export type LiquidAccount = {
  id: string;
  name: string;
};

export type LiquidRow = {
  id: string;
  label: string;
  values: Record<string, number>;
  asOfDate: string;
};

export type ExpenseLine = {
  id: string;
  name: string;
  amount: number;
  startDate: string;
  endDate: string;
};

export type IncomeLine = {
  id: string;
  name: string;
  amount: number;
  taxPercent: number;
  startDate: string;
  endDate: string;
};

export type Debt = {
  id: string;
  name: string;
  balance: number;
  interestRateAnnual: number;
  monthlyPayment: number;
  monthlyAccrual: number;
  startDate: string;
  endDate: string;
};

export type OneOffEntry = {
  id: string;
  name: string;
  amount: number;
  date: string;
  kind: 'expense' | 'income';
};

export type FinancesData = {
  liquidAccounts: LiquidAccount[];
  liquidRows: LiquidRow[];
  expenses: ExpenseLine[];
  income: IncomeLine[];
  debts: Debt[];
  oneOffs: OneOffEntry[];
};

export type FinancesTab = 'insights' | 'liquid' | 'expenses' | 'income' | 'debts' | 'oneoffs';

export type TimelinePoint = {
  date: string;
  label: string;
};

export type DebtTimelinePoint = TimelinePoint & {
  totalDebt: number;
};

export type NetWorthPoint = TimelinePoint & {
  liquid: number;
  debt: number;
  netWorth: number;
};
