export function netIncomeAmount(gross: number, taxPercent: number): number {
  return gross * (1 - taxPercent / 100);
}

export function formatCurrency(value: number): string {
  return value.toLocaleString(undefined, { style: 'currency', currency: 'EUR' });
}

export function parseAmount(raw: string): number {
  const normalized = raw.replace(/[^\d.,-]/g, '').replace(',', '.');
  const value = Number.parseFloat(normalized);
  return Number.isFinite(value) ? value : 0;
}

export function formatAxisThousands(value: number): string {
  return `${(value / 1000).toFixed(1)}k`;
}

export function formatCompactCurrency(value: number): string {
  if (Math.abs(value) >= 1000) {
    return `€${(value / 1000).toFixed(value >= 10000 ? 0 : 1)}k`;
  }
  return formatCurrency(value);
}
