import { json, type RequestHandler } from '@sveltejs/kit';
import { loadFinances, saveFinances } from '$lib/server/finances';
import type { FinancesData } from '$lib/finances/types';

export const GET: RequestHandler = async () => {
  return json(await loadFinances());
};

export const PUT: RequestHandler = async ({ request }) => {
  let data: FinancesData;

  try {
    data = (await request.json()) as FinancesData;
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  if (!data || !Array.isArray(data.liquidAccounts) || !Array.isArray(data.liquidRows)) {
    return json({ error: 'Invalid finances data.' }, { status: 400 });
  }

  if (!Array.isArray(data.oneOffs)) {
    data.oneOffs = [];
  }

  await saveFinances(data);
  return json({ ok: true });
};
