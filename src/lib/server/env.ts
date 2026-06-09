import { env } from '$env/dynamic/private';

export function requireEnv(name: 'SESSION_SECRET' | 'STATS_ADMIN_PASSWORD' | 'MEMLYRA_DATABASE_URL'): string {
  const value = env[name];
  if (!value) {
    throw new Error(`${name} is not set`);
  }
  return value;
}
