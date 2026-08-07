import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSessionToken } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

function isPublicPath(pathname: string): boolean {
  return pathname === '/login' || pathname === '/api/auth/login';
}

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(SESSION_COOKIE);
  event.locals.authenticated = validateSessionToken(token);

  const { pathname } = event.url;

  if (!event.locals.authenticated && !isPublicPath(pathname)) {
    throw redirect(303, '/login');
  }

  if (event.locals.authenticated && pathname === '/login') {
    throw redirect(303, '/dashboard');
  }

  if (pathname === '/') {
    throw redirect(303, event.locals.authenticated ? '/dashboard' : '/login');
  }

  if (pathname === '/finances' || pathname.startsWith('/finances/') || pathname === '/api/finances') {
    throw redirect(303, '/dashboard');
  }

  return resolve(event);
};
