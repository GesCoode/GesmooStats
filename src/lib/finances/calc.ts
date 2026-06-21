import {
  addMonths,
  compareMonthKeys,
  formatMonthLabel,
  isActiveInMonth,
  isOpenEnded,
  monthKey,
  monthSeriesFromKeys,
  monthStartISO,
  parseISODate,
  todayISO
} from './dates';
import { netIncomeAmount } from './format';
import type { Debt, DebtTimelinePoint, FinancesData, NetWorthPoint } from './types';

export type DebtInsight = {
  id: string;
  name: string;
  monthlyInterest: number;
  monthlyNetChange: number;
  monthsToPayoff: number | null;
  projectedBalance12Mo: number;
};

export type FinancesInsights = {
  totalLiquid: number;
  totalIncomeGross: number;
  totalIncomeNet: number;
  totalExpenses: number;
  totalDebt: number;
  totalDebtPayments: number;
  netMonthly: number;
  savingsRate: number;
  runwayMonths: number | null;
  expenseBreakdown: { name: string; amount: number; pct: number }[];
  incomeBreakdown: { name: string; gross: number; net: number; pct: number }[];
  debtInsights: DebtInsight[];
  cashFlow: {
    income: number;
    expenses: number;
    debtPayments: number;
    net: number;
  };
  debtTimeline: DebtTimelinePoint[];
  netWorthTimeline: NetWorthPoint[];
  reconciliation: ReconciliationInsights;
  currentMonthKey: string;
};

const PROJECTION_MONTHS = 60;

function monthParts(key: string): { year: number; month: number } {
  const [year, month] = key.split('-').map(Number);
  return { year, month };
}

function collectMonthBounds(data: FinancesData): { startKey: string; endKey: string } {
  const keys: string[] = [monthKey(new Date().getFullYear(), new Date().getMonth() + 1)];

  for (const row of data.liquidRows) {
    if (row.asOfDate) keys.push(row.asOfDate.slice(0, 7));
  }

  for (const item of [...data.expenses, ...data.income, ...data.debts]) {
    if (item.startDate) keys.push(item.startDate.slice(0, 7));
    if (!isOpenEnded(item.endDate)) keys.push(item.endDate.slice(0, 7));
  }

  keys.sort(compareMonthKeys);
  const startKey = keys[0] ?? monthStartISO().slice(0, 7);
  const startDate = parseISODate(`${startKey}-01`);
  const endDate = addMonths(startDate, PROJECTION_MONTHS);
  const endKey = monthKey(endDate.getFullYear(), endDate.getMonth() + 1);

  return { startKey, endKey };
}

export function buildTimeline(data: FinancesData): string[] {
  const { startKey, endKey } = collectMonthBounds(data);
  return monthSeriesFromKeys(startKey, endKey);
}

export function totalLiquid(data: FinancesData): number {
  return data.liquidRows.reduce(
    (sum, row) =>
      sum +
      data.liquidAccounts.reduce((rowSum, account) => rowSum + (row.values[account.id] ?? 0), 0),
    0
  );
}

export function liquidForMonth(data: FinancesData, monthKeyValue: string): number {
  const snapshots = [...data.liquidRows]
    .filter((row) => row.asOfDate.slice(0, 7) <= monthKeyValue)
    .sort((a, b) => b.asOfDate.localeCompare(a.asOfDate));

  const row = snapshots[0] ?? data.liquidRows[0];
  if (!row) return 0;

  return data.liquidAccounts.reduce((sum, account) => sum + (row.values[account.id] ?? 0), 0);
}

export function monthlyExpenses(data: FinancesData, key: string): number {
  const { year, month } = monthParts(key);
  return data.expenses.reduce((sum, item) => {
    if (!isActiveInMonth(item.startDate, item.endDate, year, month)) return sum;
    return sum + item.amount;
  }, 0);
}

export function monthlyIncomeGross(data: FinancesData, key: string): number {
  const { year, month } = monthParts(key);
  return data.income.reduce((sum, item) => {
    if (!isActiveInMonth(item.startDate, item.endDate, year, month)) return sum;
    return sum + item.amount;
  }, 0);
}

export function monthlyIncomeNet(data: FinancesData, key: string): number {
  const { year, month } = monthParts(key);
  return data.income.reduce((sum, item) => {
    if (!isActiveInMonth(item.startDate, item.endDate, year, month)) return sum;
    return sum + netIncomeAmount(item.amount, item.taxPercent);
  }, 0);
}

export function monthlyDebtPayments(data: FinancesData, key: string): number {
  const { year, month } = monthParts(key);
  return data.debts.reduce((sum, item) => {
    if (!isActiveInMonth(item.startDate, item.endDate, year, month)) return sum;
    return sum + item.monthlyPayment;
  }, 0);
}

function debtActiveInMonth(debt: Debt, key: string): boolean {
  const { year, month } = monthParts(key);
  return isActiveInMonth(debt.startDate, debt.endDate, year, month);
}

function debtHasStarted(debt: Debt, key: string): boolean {
  if (!debt.startDate) return true;
  return debt.startDate.slice(0, 7) <= key;
}

export function projectDebt(debt: Debt, maxMonths = 360): DebtInsight {
  const monthlyRate = debt.interestRateAnnual / 100 / 12;
  let balance = debt.balance;
  let monthsToPayoff: number | null = null;

  for (let month = 1; month <= maxMonths; month += 1) {
    const interest = balance * monthlyRate;
    balance = balance + interest + debt.monthlyAccrual - debt.monthlyPayment;

    if (balance <= 0) {
      monthsToPayoff = month;
      break;
    }
  }

  const monthlyInterest = debt.balance * monthlyRate;
  const monthlyNetChange = monthlyInterest + debt.monthlyAccrual - debt.monthlyPayment;
  const projectedBalance12Mo = (() => {
    let projected = debt.balance;
    for (let month = 0; month < 12; month += 1) {
      projected = projected + projected * monthlyRate + debt.monthlyAccrual - debt.monthlyPayment;
      if (projected <= 0) return 0;
    }
    return projected;
  })();

  return {
    id: debt.id,
    name: debt.name,
    monthlyInterest,
    monthlyNetChange,
    monthsToPayoff,
    projectedBalance12Mo
  };
}

export function projectCombinedDebtTimeline(data: FinancesData): DebtTimelinePoint[] {
  const timeline = buildTimeline(data);
  const balances = new Map(data.debts.map((debt) => [debt.id, debt.balance]));

  return timeline.map((key) => {
    let totalDebt = 0;

    for (const debt of data.debts) {
      if (!debtHasStarted(debt, key)) continue;

      let balance = balances.get(debt.id) ?? debt.balance;

      if (debtActiveInMonth(debt, key)) {
        const monthlyRate = debt.interestRateAnnual / 100 / 12;
        balance = balance + balance * monthlyRate + debt.monthlyAccrual - debt.monthlyPayment;
        if (balance < 0) balance = 0;
        balances.set(debt.id, balance);
      }

      totalDebt += balance;
    }

    return {
      date: key,
      label: formatMonthLabel(key),
      totalDebt
    };
  });
}

export function projectNetWorthTimeline(data: FinancesData): NetWorthPoint[] {
  const timeline = buildTimeline(data);
  const debtTimeline = projectCombinedDebtTimeline(data);
  const debtByMonth = new Map(debtTimeline.map((point) => [point.date, point.totalDebt]));

  let cash = liquidForMonth(data, timeline[0] ?? monthStartISO().slice(0, 7));
  let lastSnapshotMonth = data.liquidRows
    .map((row) => row.asOfDate.slice(0, 7))
    .sort(compareMonthKeys)[0];

  return timeline.map((key, index) => {
    const snapshotLiquid = liquidForMonth(data, key);
    const snapshotMonth = data.liquidRows
      .filter((row) => row.asOfDate.slice(0, 7) <= key)
      .sort((a, b) => b.asOfDate.localeCompare(a.asOfDate))[0]?.asOfDate.slice(0, 7);

    if (snapshotMonth && snapshotMonth !== lastSnapshotMonth) {
      cash = snapshotLiquid;
      lastSnapshotMonth = snapshotMonth;
    } else if (index === 0) {
      cash = snapshotLiquid;
    } else {
      const income = monthlyIncomeNet(data, key);
      const expenses = monthlyExpenses(data, key);
      const payments = monthlyDebtPayments(data, key);
      cash += income - expenses - payments;
    }

    const debt = debtByMonth.get(key) ?? 0;

    return {
      date: key,
      label: formatMonthLabel(key),
      liquid: cash,
      debt,
      netWorth: cash - debt
    };
  });
}

export function computeInsights(data: FinancesData): FinancesInsights {
  const currentMonthKey = monthKey(new Date().getFullYear(), new Date().getMonth() + 1);
  const { year, month } = monthParts(currentMonthKey);
  const liquid = totalLiquid(data);
  const incomeGross = monthlyIncomeGross(data, currentMonthKey);
  const incomeNet = monthlyIncomeNet(data, currentMonthKey);
  const expenses = monthlyExpenses(data, currentMonthKey);
  const debt = data.debts.reduce((sum, item) => sum + item.balance, 0);
  const debtPayments = monthlyDebtPayments(data, currentMonthKey);
  const net = incomeNet - expenses - debtPayments;

  const expenseTotal = expenses || 1;
  const incomeTotal = incomeNet || 1;

  const burn = expenses + debtPayments - incomeNet;
  const runwayMonths = burn > 0 && liquid > 0 ? liquid / burn : null;

  return {
    totalLiquid: liquid,
    totalIncomeGross: incomeGross,
    totalIncomeNet: incomeNet,
    totalExpenses: expenses,
    totalDebt: debt,
    totalDebtPayments: debtPayments,
    netMonthly: net,
    savingsRate: incomeNet > 0 ? (net / incomeNet) * 100 : 0,
    runwayMonths,
    expenseBreakdown: data.expenses
      .filter((item) => isActiveInMonth(item.startDate, item.endDate, year, month))
      .map((item) => ({
        name: item.name,
        amount: item.amount,
        pct: (item.amount / expenseTotal) * 100
      })),
    incomeBreakdown: data.income
      .filter((item) => isActiveInMonth(item.startDate, item.endDate, year, month))
      .map((item) => ({
        name: item.name,
        gross: item.amount,
        net: netIncomeAmount(item.amount, item.taxPercent),
        pct: (netIncomeAmount(item.amount, item.taxPercent) / incomeTotal) * 100
      })),
    debtInsights: data.debts.map((item) => projectDebt(item)),
    cashFlow: {
      income: incomeNet,
      expenses,
      debtPayments,
      net
    },
    debtTimeline: projectCombinedDebtTimeline(data),
    netWorthTimeline: projectNetWorthTimeline(data),
    reconciliation: buildReconciliationTimeline(data),
    currentMonthKey
  };
}

export type ReconciliationPoint = {
  date: string;
  label: string;
  expectedLiquid: number;
  expectedWithOneOffs: number;
  actualLiquid: number;
  cumulativeGap: number;
  monthlyExtraSpend: number;
  loggedOneOffNet: number;
  unexplainedGap: number;
};

export type ReconciliationInsights = {
  points: ReconciliationPoint[];
  currentGap: number;
  medianExtraSpend: number | null;
  currentMonthExtraSpend: number;
  totalLoggedOneOffs: number;
};

function oneOffNetInMonth(data: FinancesData, key: string): number {
  return data.oneOffs.reduce((sum, entry) => {
    if (entry.date.slice(0, 7) !== key) return sum;
    return sum + (entry.kind === 'income' ? entry.amount : -entry.amount);
  }, 0);
}

function anchorSnapshot(data: FinancesData): { month: string; liquid: number } | null {
  const rows = [...data.liquidRows].sort((a, b) => a.asOfDate.localeCompare(b.asOfDate));
  const row = rows[0];
  if (!row) return null;

  const liquid = data.liquidAccounts.reduce(
    (sum, account) => sum + (row.values[account.id] ?? 0),
    0
  );

  return { month: row.asOfDate.slice(0, 7), liquid };
}

function medianPositive(values: number[]): number | null {
  const sorted = values.filter((value) => value > 0).sort((a, b) => a - b);
  if (sorted.length === 0) return null;
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

export function buildReconciliationTimeline(data: FinancesData): ReconciliationInsights {
  const anchor = anchorSnapshot(data);
  const currentMonthKey = monthKey(new Date().getFullYear(), new Date().getMonth() + 1);

  if (!anchor) {
    return {
      points: [],
      currentGap: 0,
      medianExtraSpend: null,
      currentMonthExtraSpend: 0,
      totalLoggedOneOffs: data.oneOffs.reduce(
        (sum, entry) => sum + (entry.kind === 'income' ? entry.amount : -entry.amount),
        0
      )
    };
  }

  const months = buildTimeline(data)
    .filter((key) => key >= anchor.month && key <= currentMonthKey)
    .sort(compareMonthKeys);

  let expectedLiquid = anchor.liquid;
  let expectedWithOneOffs = anchor.liquid;
  let previousExpected = anchor.liquid;
  const points: ReconciliationPoint[] = [];

  for (const key of months) {
    const actualLiquid = liquidForMonth(data, key);
    const recurringNet =
      monthlyIncomeNet(data, key) - monthlyExpenses(data, key) - monthlyDebtPayments(data, key);
    const loggedOneOffNet = oneOffNetInMonth(data, key);

    if (key === anchor.month) {
      expectedLiquid = anchor.liquid;
      expectedWithOneOffs = anchor.liquid;
      previousExpected = anchor.liquid;
    } else {
      expectedLiquid += recurringNet;
      expectedWithOneOffs += recurringNet + loggedOneOffNet;
    }

    const monthlyExtraSpend =
      key === anchor.month ? 0 : previousExpected + recurringNet - actualLiquid;
    const cumulativeGap = actualLiquid - expectedLiquid;
    const unexplainedGap = actualLiquid - expectedWithOneOffs;

    points.push({
      date: key,
      label: formatMonthLabel(key),
      expectedLiquid,
      expectedWithOneOffs,
      actualLiquid,
      cumulativeGap,
      monthlyExtraSpend,
      loggedOneOffNet,
      unexplainedGap
    });

    previousExpected = expectedLiquid;
  }

  const currentPoint = points[points.length - 1];

  return {
    points,
    currentGap: currentPoint?.cumulativeGap ?? 0,
    medianExtraSpend: medianPositive(points.map((point) => point.monthlyExtraSpend)),
    currentMonthExtraSpend: currentPoint?.monthlyExtraSpend ?? 0,
    totalLoggedOneOffs: data.oneOffs.reduce(
      (sum, entry) => sum + (entry.kind === 'income' ? entry.amount : -entry.amount),
      0
    )
  };
}
