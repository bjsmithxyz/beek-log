import {
  SESSION_COOKIE,
  STATE_COOKIE,
  clearCookie,
  isSameOrigin,
  json,
} from '../../src/server/auth.mjs';

export default async function authLogout(request) {
  if (request.method !== 'POST') return json(405, { ok: false, error: 'Method not allowed' }, { Allow: 'POST' });
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return json(415, { ok: false, error: 'Content-Type must be application/json' });
  }
  if (!isSameOrigin(request)) return json(403, { ok: false, error: 'Cross-origin request refused' });
  const response = json(200, { ok: true });
  response.headers.append('Set-Cookie', clearCookie(SESSION_COOKIE));
  response.headers.append('Set-Cookie', clearCookie(STATE_COOKIE));
  return response;
}
