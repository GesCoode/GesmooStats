import type { FinancesData } from './types';

let timer: ReturnType<typeof setTimeout> | null = null;

export function scheduleFinancesSave(
  data: FinancesData,
  onStatus: (status: 'saved' | 'saving' | 'error') => void
): void {
  if (timer) clearTimeout(timer);
  onStatus('saving');

  timer = setTimeout(async () => {
    try {
      const response = await fetch('/api/finances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        onStatus('error');
        return;
      }

      onStatus('saved');
    } catch {
      onStatus('error');
    }
  }, 500);
}
