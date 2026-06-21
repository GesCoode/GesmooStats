import { monthStartISO, todayISO } from './dates';
import type { FinancesData } from './types';

function id(): string {
  return crypto.randomUUID();
}

export function createDefaultFinances(): FinancesData {
  const startDate = monthStartISO();
  const accounts = [
    { id: id(), name: 'Bank1' },
    { id: id(), name: 'Bank2' },
    { id: id(), name: 'PayPal' },
    { id: id(), name: 'Credit card' },
    { id: id(), name: 'Cash' },
    { id: id(), name: 'Revolut' }
  ];

  return {
    liquidAccounts: accounts,
    liquidRows: [{ id: id(), label: 'Current', values: {}, asOfDate: todayISO() }],
    expenses: [
      { id: id(), name: 'Rent', amount: 0, startDate, endDate: '' },
      { id: id(), name: 'Spotify', amount: 0, startDate, endDate: '' },
      { id: id(), name: 'Telephone', amount: 0, startDate, endDate: '' },
      { id: id(), name: 'Internet', amount: 0, startDate, endDate: '' },
      { id: id(), name: 'Insurance', amount: 0, startDate, endDate: '' }
    ],
    income: [{ id: id(), name: 'Salary', amount: 0, taxPercent: 0, startDate, endDate: '' }],
    debts: [],
    oneOffs: []
  };
}

export function migrateFinances(raw: Partial<FinancesData>): FinancesData {
  const defaults = createDefaultFinances();
  const startDate = monthStartISO();

  return {
    liquidAccounts: raw.liquidAccounts?.length ? raw.liquidAccounts : defaults.liquidAccounts,
    liquidRows: (raw.liquidRows ?? defaults.liquidRows).map((row) => ({
      id: row.id,
      label: row.label,
      values: row.values ?? {},
      asOfDate: (row as { asOfDate?: string }).asOfDate ?? todayISO()
    })),
    expenses: (raw.expenses ?? defaults.expenses).map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount ?? 0,
      startDate: (item as { startDate?: string }).startDate ?? startDate,
      endDate: (item as { endDate?: string }).endDate ?? ''
    })),
    income: (raw.income ?? defaults.income).map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount ?? 0,
      taxPercent: (item as { taxPercent?: number }).taxPercent ?? 0,
      startDate: (item as { startDate?: string }).startDate ?? startDate,
      endDate: (item as { endDate?: string }).endDate ?? ''
    })),
    debts: (raw.debts ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      balance: item.balance ?? 0,
      interestRateAnnual: item.interestRateAnnual ?? 0,
      monthlyPayment: item.monthlyPayment ?? 0,
      monthlyAccrual: item.monthlyAccrual ?? 0,
      startDate: (item as { startDate?: string }).startDate ?? startDate,
      endDate: (item as { endDate?: string }).endDate ?? ''
    })),
    oneOffs: (raw.oneOffs ?? []).map((item) => ({
      id: item.id,
      name: item.name,
      amount: item.amount ?? 0,
      date: item.date ?? todayISO(),
      kind: item.kind === 'income' ? 'income' : 'expense'
    }))
  };
}
