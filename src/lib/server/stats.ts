import postgres from 'postgres';
import { env } from '$env/dynamic/private';

export type SiteStats = {
  id: string;
  name: string;
  url: string;
  status: 'ok' | 'unavailable' | 'no_accounts' | 'coming_soon';
  totalAccounts: number | null;
  verifiedAccounts: number | null;
  unverifiedAccounts: number | null;
  last7Days: number | null;
  last30Days: number | null;
  error?: string;
  note?: string;
};

type UserCountRow = {
  total: string;
  verified: string;
  unverified: string;
  last_7_days: string;
  last_30_days: string;
};

let memlyraSql: ReturnType<typeof postgres> | null = null;
let cutepicsSql: ReturnType<typeof postgres> | null = null;

function getMemlyraSql() {
  if (!memlyraSql) {
    const url = env.MEMLYRA_DATABASE_URL;
    if (!url) {
      throw new Error('MEMLYRA_DATABASE_URL is not set');
    }
    memlyraSql = postgres(url, { max: 2, idle_timeout: 20 });
  }
  return memlyraSql;
}

function getCutepicsSql() {
  if (!cutepicsSql) {
    const url = env.CUTEPICS_DATABASE_URL;
    if (!url) {
      throw new Error('CUTEPICS_DATABASE_URL is not set');
    }
    cutepicsSql = postgres(url, { max: 2, idle_timeout: 20 });
  }
  return cutepicsSql;
}

async function fetchMemlyraStats(): Promise<SiteStats> {
  const sql = getMemlyraSql();

  const rows = await sql<UserCountRow[]>`
    SELECT
      COUNT(*)::text AS total,
      COUNT(*) FILTER (WHERE email_verified)::text AS verified,
      COUNT(*) FILTER (WHERE NOT email_verified)::text AS unverified,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days')::text AS last_7_days,
      COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')::text AS last_30_days
    FROM users
  `;

  const row = rows[0];

  return {
    id: 'memlyra',
    name: 'MemLyra',
    url: 'https://memlyra.com',
    status: 'ok',
    totalAccounts: Number(row.total),
    verifiedAccounts: Number(row.verified),
    unverifiedAccounts: Number(row.unverified),
    last7Days: Number(row.last_7_days),
    last30Days: Number(row.last_30_days)
  };
}

async function fetchCutePicsStats(): Promise<SiteStats> {
  const sql = getCutepicsSql();

  const rows = await sql<UserCountRow[]>`
    SELECT
      COUNT(*) FILTER (WHERE active)::text AS total,
      COUNT(*) FILTER (WHERE active AND confirmed_at IS NOT NULL)::text AS verified,
      COUNT(*) FILTER (WHERE active AND confirmed_at IS NULL)::text AS unverified,
      COUNT(*) FILTER (WHERE active AND created_at > NOW() - INTERVAL '7 days')::text AS last_7_days,
      COUNT(*) FILTER (WHERE active AND created_at > NOW() - INTERVAL '30 days')::text AS last_30_days
    FROM subscribers
  `;

  const row = rows[0];

  return {
    id: 'cutepics',
    name: 'CutePics',
    url: 'https://cutepics.gesmoo.com',
    status: 'ok',
    totalAccounts: Number(row.total),
    verifiedAccounts: Number(row.verified),
    unverifiedAccounts: Number(row.unverified),
    last7Days: Number(row.last_7_days),
    last30Days: Number(row.last_30_days),
    note: 'Email signups (active subscribers)'
  };
}

const staticSites: SiteStats[] = [
  {
    id: 'visagely',
    name: 'Visagely',
    url: 'https://visagely.com',
    status: 'coming_soon',
    totalAccounts: null,
    verifiedAccounts: null,
    unverifiedAccounts: null,
    last7Days: null,
    last30Days: null,
    note: 'Announcement page live · early bird signups not connected yet'
  },
  {
    id: 'hue-do',
    name: 'HueDo',
    url: 'https://hue-do.com',
    status: 'no_accounts',
    totalAccounts: null,
    verifiedAccounts: null,
    unverifiedAccounts: null,
    last7Days: null,
    last30Days: null
  }
];

export async function loadAllSiteStats(): Promise<{
  sites: SiteStats[];
  totals: {
    totalAccounts: number;
    verifiedAccounts: number;
    last7Days: number;
    last30Days: number;
  };
  fetchedAt: string;
}> {
  let memlyra: SiteStats;

  try {
    memlyra = await fetchMemlyraStats();
  } catch (error) {
    memlyra = {
      id: 'memlyra',
      name: 'MemLyra',
      url: 'https://memlyra.com',
      status: 'unavailable',
      totalAccounts: null,
      verifiedAccounts: null,
      unverifiedAccounts: null,
      last7Days: null,
      last30Days: null,
      error: error instanceof Error ? error.message : 'Could not load stats'
    };
  }

  let cutepics: SiteStats;

  try {
    cutepics = await fetchCutePicsStats();
  } catch (error) {
    cutepics = {
      id: 'cutepics',
      name: 'CutePics',
      url: 'https://cutepics.gesmoo.com',
      status: 'unavailable',
      totalAccounts: null,
      verifiedAccounts: null,
      unverifiedAccounts: null,
      last7Days: null,
      last30Days: null,
      error: error instanceof Error ? error.message : 'Could not load stats'
    };
  }

  const sites = [memlyra, cutepics, ...staticSites];

  const totals = sites.reduce(
    (acc, site) => {
      if (site.status !== 'ok') return acc;
      acc.totalAccounts += site.totalAccounts ?? 0;
      acc.verifiedAccounts += site.verifiedAccounts ?? 0;
      acc.last7Days += site.last7Days ?? 0;
      acc.last30Days += site.last30Days ?? 0;
      return acc;
    },
    { totalAccounts: 0, verifiedAccounts: 0, last7Days: 0, last30Days: 0 }
  );

  return {
    sites,
    totals,
    fetchedAt: new Date().toISOString()
  };
}
