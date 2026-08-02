import crypto from 'node:crypto';
import {
  env,
  json,
  oauthStateCookie,
  redirect,
  siteUrl,
  validateNext,
} from '../../src/server/auth.mjs';

const base64url = (buffer) => Buffer.from(buffer).toString('base64url');

export default async function authLogin(request) {
  if (request.method !== 'GET') return json(405, { ok: false, error: 'Method not allowed' }, { Allow: 'GET' });
  try {
    const requestUrl = new URL(request.url);
    const next = validateNext(requestUrl.searchParams.get('next'));
    const state = crypto.randomBytes(24).toString('hex');
    const verifier = base64url(crypto.randomBytes(32));
    const challenge = base64url(crypto.createHash('sha256').update(verifier).digest());
    const redirectUri = `${siteUrl()}/.netlify/functions/auth-callback`;
    const authorize = new URL('https://github.com/login/oauth/authorize');
    authorize.searchParams.set('client_id', env('GITHUB_CLIENT_ID'));
    authorize.searchParams.set('redirect_uri', redirectUri);
    authorize.searchParams.set('state', state);
    authorize.searchParams.set('code_challenge', challenge);
    authorize.searchParams.set('code_challenge_method', 'S256');
    authorize.searchParams.set('allow_signup', 'false');
    return redirect(authorize.toString(), [oauthStateCookie({
      state, verifier, next, expiresAt: Date.now() + 10 * 60 * 1000,
    })]);
  } catch {
    return json(500, { ok: false, error: 'Authentication is not configured' });
  }
}
