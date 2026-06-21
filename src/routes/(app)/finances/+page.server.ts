import type { PageServerLoad } from './$types';
import { loadFinances } from '$lib/server/finances';

export const load: PageServerLoad = async () => {
  return { finances: await loadFinances() };
};
