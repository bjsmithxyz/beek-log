import crypto from 'node:crypto';

export const SESSION_COOKIE = '__Host-beek_session';
export const STATE_COOKIE = '__Host-beek_oauth_state';
export const SESSION_TTL_SECONDS = 24 * 60 * 60;
export const STATE_TTL_SECONDS = 10 * 60;
const REFRESH_WINDOW_MS = 5 * 60 * 1000;
const NEXT_PATH = /^\/(?!\/)[a-z0-9/_-]*$/;

export function env(name, fallback) {
  const value = process.env[name];
  if (value != null && value !== '') return value;
  if (fallback !== undefined) return fallback;
  throw new Error(`Missing environment configuration: ${name}`);
}

export function siteUrl() {
  return env('ADMIN_SITE_URL', 'http://localhost:8888').replace(/\/$/, '');
}

export function allowedLogin() {
  const users = env('OAUTH_ALLOWED_USERS')
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  if (users.length !== 1) throw new Error('OAUTH_ALLOWED_USERS must contain exactly one GitHub login');
  return users[0];
}

export function isAllowedLogin(login) {
  return String(login || '').toLowerCase() === allowedLogin();
}

export function validateNext(value, fallback = '/') {
  return typeof value === 'string' && NEXT_PATH.test(value) ? value : fallback;
}

function keyFromSecret(secret) {
  if (typeof secret !== 'string' || secret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters');
  }
  return crypto.createHash('sha256').update(secret).digest();
}

export function seal(payload, secret = env('SESSION_SECRET'), purpose = 'session') {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', keyFromSecret(secret), iv);
  cipher.setAAD(Buffer.from(`beek-admin:${purpose}:v1`));
  const encrypted = Buffer.concat([cipher.update(JSON.stringify(payload), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

export function unseal(value, secret = env('SESSION_SECRET'), purpose = 'session') {
  const buffer = Buffer.from(value, 'base64url');
  if (buffer.length < 29) throw new Error('bad sealed value');
  const decipher = crypto.createDecipheriv('aes-256-gcm', keyFromSecret(secret), buffer.subarray(0, 12));
  decipher.setAAD(Buffer.from(`beek-admin:${purpose}:v1`));
  decipher.setAuthTag(buffer.subarray(12, 28));
  const json = Buffer.concat([decipher.update(buffer.subarray(28)), decipher.final()]).toString('utf8');
  return JSON.parse(json);
}

export function parseCookies(header) {
  const cookies = {};
  for (const part of String(header || '').split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    try {
      cookies[name] = decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      // Ignore one malformed cookie rather than invalidating every cookie.
    }
  }
  return cookies;
}

function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${Math.max(0, Math.floor(maxAge))}`;
}

export function clearCookie(name) {
  return cookie(name, '', 0);
}

export function createSession(login, tokenResponse, now = Date.now()) {
  if (!tokenResponse?.access_token) throw new Error('GitHub did not return an access token');
  return {
    login,
    token: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token || null,
    tokenExpiresAt: tokenResponse.expires_in ? now + Number(tokenResponse.expires_in) * 1000 : null,
    refreshExpiresAt: tokenResponse.refresh_token_expires_in
      ? now + Number(tokenResponse.refresh_token_expires_in) * 1000
      : null,
    expiresAt: now + SESSION_TTL_SECONDS * 1000,
  };
}

export function sessionCookie(session, now = Date.now()) {
  const remaining = Math.max(0, Math.ceil((session.expiresAt - now) / 1000));
  return cookie(SESSION_COOKIE, seal(session), Math.min(SESSION_TTL_SECONDS, remaining));
}

export function oauthStateCookie(payload) {
  return cookie(STATE_COOKIE, seal(payload, env('SESSION_SECRET'), 'oauth-state'), STATE_TTL_SECONDS);
}

async function refreshAccessToken(session, fetchImpl, now) {
  if (!session.refreshToken || (session.refreshExpiresAt && session.refreshExpiresAt <= now)) {
    throw new Error('refresh unavailable');
  }
  const response = await fetchImpl('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: env('GITHUB_CLIENT_ID'),
      client_secret: env('GITHUB_CLIENT_SECRET'),
      grant_type: 'refresh_token',
      refresh_token: session.refreshToken,
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error('refresh failed');
  return {
    ...session,
    token: body.access_token,
    refreshToken: body.refresh_token || session.refreshToken,
    tokenExpiresAt: body.expires_in ? now + Number(body.expires_in) * 1000 : null,
    refreshExpiresAt: body.refresh_token_expires_in
      ? now + Number(body.refresh_token_expires_in) * 1000
      : session.refreshExpiresAt,
  };
}

// Returns a session plus an optional Set-Cookie value when a token was rotated
// or a broken session should be cleared. Refresh never extends the 24-hour
// absolute session expiry.
export async function readSession(request, {
  fetchImpl = fetch,
  now = Date.now(),
} = {}) {
  const raw = parseCookies(request.headers.get('cookie'))[SESSION_COOKIE];
  if (!raw) return { session: null, setCookie: null };
  let session;
  try {
    session = unseal(raw);
    if (!session?.login || !session?.token || !session?.expiresAt) throw new Error('invalid session');
    if (session.expiresAt <= now || !isAllowedLogin(session.login)) throw new Error('expired session');
  } catch {
    return { session: null, setCookie: clearCookie(SESSION_COOKIE) };
  }

  if (session.tokenExpiresAt && session.tokenExpiresAt <= now + REFRESH_WINDOW_MS) {
    try {
      session = await refreshAccessToken(session, fetchImpl, now);
      return { session, setCookie: sessionCookie(session, now) };
    } catch {
      return { session: null, setCookie: clearCookie(SESSION_COOKIE) };
    }
  }
  return { session, setCookie: null };
}

export function isSameOrigin(request) {
  const origin = request.headers.get('origin');
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(siteUrl()).origin;
  } catch {
    return false;
  }
}

export function stateMatches(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'beek-admin',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

export function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex, nofollow',
      ...extraHeaders,
    },
  });
}

export function redirect(location, cookies = []) {
  const headers = new Headers({ Location: location, 'Cache-Control': 'no-store' });
  for (const value of cookies) if (value) headers.append('Set-Cookie', value);
  return new Response(null, { status: 302, headers });
}

export function withSessionCookie(response, value) {
  if (value) response.headers.append('Set-Cookie', value);
  return response;
}
