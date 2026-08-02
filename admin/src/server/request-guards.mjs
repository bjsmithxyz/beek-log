import { isSameOrigin, json, readSession, withSessionCookie } from './auth.mjs';

export const DEFAULT_MAX_BODY_BYTES = 256 * 1024;

function result(response, setCookie = null) {
  return { response: withSessionCookie(response, setCookie) };
}

export async function requireGetSession(request) {
  if (request.method !== 'GET') {
    return result(json(405, { ok: false, error: 'Method not allowed' }, { Allow: 'GET' }));
  }
  const { session, setCookie } = await readSession(request);
  if (!session) return result(json(401, { ok: false, error: 'Not signed in' }), setCookie);
  return { session, setCookie };
}

// Guard order is intentional and tested: method, content type, origin, session,
// size/JSON. Endpoint-specific schema and path checks run after this function
// and before any GitHub side effect.
export async function requireJsonMutation(request, { maxBytes = DEFAULT_MAX_BODY_BYTES } = {}) {
  if (request.method !== 'POST') {
    return result(json(405, { ok: false, error: 'Method not allowed' }, { Allow: 'POST' }));
  }
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.toLowerCase().startsWith('application/json')) {
    return result(json(415, { ok: false, error: 'Content-Type must be application/json' }));
  }
  if (!isSameOrigin(request)) {
    return result(json(403, { ok: false, error: 'Cross-origin request refused' }));
  }

  const { session, setCookie } = await readSession(request);
  if (!session) return result(json(401, { ok: false, error: 'Not signed in' }), setCookie);

  const declaredLength = Number(request.headers.get('content-length'));
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    return result(json(413, { ok: false, error: 'Request is too large' }), setCookie);
  }
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > maxBytes) {
    return result(json(413, { ok: false, error: 'Request is too large' }), setCookie);
  }
  let body;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return result(json(400, { ok: false, error: 'Invalid JSON body' }), setCookie);
  }
  return { session, setCookie, body };
}

export function mutationResponse(response, context) {
  return withSessionCookie(response, context?.setCookie);
}
