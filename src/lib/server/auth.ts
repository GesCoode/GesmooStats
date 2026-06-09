import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { env } from '$env/dynamic/private';
import { requireEnv } from '$lib/server/env';

export const SESSION_COOKIE = 'gesmoo_stats_session';
const SESSION_DAYS = 7;

function getSecret(): string {
  return requireEnv('SESSION_SECRET');
}

function signPayload(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('hex');
}

export function verifyAdminPassword(password: string): boolean {
  const expected = env.STATS_ADMIN_PASSWORD ?? '';
  if (!expected) return false;

  const a = Buffer.from(password);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;

  return timingSafeEqual(a, b);
}

export function createSessionToken(): { token: string; expiresAt: Date } {
  const id = randomBytes(32).toString('hex');
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  const payload = `${id}.${expiresAt.getTime()}`;
  const token = `${payload}.${signPayload(payload)}`;
  return { token, expiresAt };
}

export function validateSessionToken(token: string | undefined): boolean {
  if (!token) return false;

  const parts = token.split('.');
  if (parts.length !== 3) return false;

  const [id, exp, sig] = parts;
  const payload = `${id}.${exp}`;
  const expectedSig = signPayload(payload);

  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }

  const expiresAt = Number(exp);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false;
  }

  return true;
}

export function setSessionCookie(
  cookies: import('@sveltejs/kit').Cookies,
  token: string,
  expiresAt: Date,
  secure: boolean
): void {
  cookies.set(SESSION_COOKIE, token, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure,
    expires: expiresAt
  });
}

export function clearSessionCookie(cookies: import('@sveltejs/kit').Cookies): void {
  cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function cookieIsSecure(url: URL): boolean {
  const origin = env.ORIGIN?.replace(/\/$/, '');
  if (origin?.startsWith('https://')) return true;
  return url.protocol === 'https:';
}
