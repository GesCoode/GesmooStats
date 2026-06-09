import { json, type RequestHandler } from '@sveltejs/kit';
import {
  cookieIsSecure,
  createSessionToken,
  setSessionCookie,
  verifyAdminPassword
} from '$lib/server/auth';

export const POST: RequestHandler = async ({ request, cookies, url }) => {
  let body: { password?: string };

  try {
    body = await request.json();
  } catch {
    return json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const password = body.password ?? '';
  if (!password) {
    return json({ error: 'Enter the admin password.' }, { status: 400 });
  }

  if (!verifyAdminPassword(password)) {
    return json({ error: 'Invalid password.' }, { status: 401 });
  }

  const session = createSessionToken();
  setSessionCookie(cookies, session.token, session.expiresAt, cookieIsSecure(url));

  return json({ ok: true });
};
