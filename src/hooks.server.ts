import { redirect } from '@sveltejs/kit';
import { SESSION_COOKIE, validateSessionToken } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

const publicPaths = new Set(['/login']);

export const handle: Handle = async ({ event, resolve }) => {
  const token = event.cookies.get(SESSION_COOKIE);
  event.locals.authenticated = validateSessionToken(token);

  const { pathname } = event.url;

  if (!event.locals.authenticated && !publicPaths.has(pathname)) {
    throw redirect(303, '/login');
  }

  if (event.locals.authenticated && pathname === '/login') {
    throw redirect(303, '/dashboard');
  }

  if (pathname === '/') {
    throw redirect(303, event.locals.authenticated ? '/dashboard' : '/login');
  }

  return resolve(event);
};
