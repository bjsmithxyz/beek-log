import { json, readSession, withSessionCookie } from '../../src/server/auth.mjs';

export default async function authMe(request) {
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' }, { Allow: 'GET' });
  const { session, setCookie } = await readSession(request);
  if (!session) return withSessionCookie(json(401, { ok: false, login: null }), setCookie);
  return withSessionCookie(json(200, { ok: true, login: session.login }), setCookie);
}
