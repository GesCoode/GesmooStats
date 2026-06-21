export function todayISO(): string {
  const date = new Date();
  return toISODate(date);
}

export function monthStartISO(): string {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

export function toISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function parseISODate(value: string): Date {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isOpenEnded(endDate: string): boolean {
  return !endDate.trim();
}

export function monthKey(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatMonthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'short',
    year: '2-digit'
  });
}

export function addMonths(date: Date, count: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + count, 1);
}

export function isActiveInMonth(startDate: string, endDate: string, year: number, month: number): boolean {
  if (!startDate) return true;

  const periodStart = new Date(year, month - 1, 1);
  const periodEnd = new Date(year, month, 0);
  const itemStart = parseISODate(startDate);

  if (periodEnd < itemStart) return false;

  if (!isOpenEnded(endDate)) {
    const itemEnd = parseISODate(endDate);
    if (periodStart > itemEnd) return false;
  }

  return true;
}

export function compareMonthKeys(a: string, b: string): number {
  return a.localeCompare(b);
}

export function monthSeriesFromKeys(startKey: string, endKey: string): string[] {
  const [startYear, startMonth] = startKey.split('-').map(Number);
  const [endYear, endMonth] = endKey.split('-').map(Number);
  const months: string[] = [];
  let cursor = new Date(startYear, startMonth - 1, 1);
  const end = new Date(endYear, endMonth - 1, 1);

  while (cursor <= end) {
    months.push(monthKey(cursor.getFullYear(), cursor.getMonth() + 1));
    cursor = addMonths(cursor, 1);
  }

  return months;
}
