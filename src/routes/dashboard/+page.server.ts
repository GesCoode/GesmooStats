import type { PageServerLoad } from './$types';
import { loadAllSiteStats } from '$lib/server/stats';

export const load: PageServerLoad = async () => {
  return loadAllSiteStats();
};
