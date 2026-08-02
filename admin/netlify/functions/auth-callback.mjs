import {
  STATE_COOKIE,
  allowedLogin,
  clearCookie,
  createSession,
  env,
  githubHeaders,
  isAllowedLogin,
  parseCookies,
  redirect,
  sessionCookie,
  siteUrl,
  stateMatches,
  unseal,
  validateNext,
} from '../../src/server/auth.mjs';

const stateClear = () => clearCookie(STATE_COOKIE);
const authError = (reason) => redirect(`${siteUrl()}/?auth=error&reason=${reason}`, [stateClear()]);

export default async function authCallback(request) {
  if (request.method !== 'GET') return authError('method');
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const returnedState = url.searchParams.get('state');
    const rawState = parseCookies(request.headers.get('cookie'))[STATE_COOKIE];
    if (!code || !returnedState || !rawState) return authError('missing_code');

    let pending;
    try {
      pending = unseal(rawState, env('SESSION_SECRET'), 'oauth-state');
    } catch {
      return authError('bad_state');
    }
    if (pending.expiresAt <= Date.now() || !stateMatches(pending.state, returnedState)) {
      return authError('bad_state');
    }

    const redirectUri = `${siteUrl()}/.netlify/functions/auth-callback`;
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: env('GITHUB_CLIENT_ID'),
        client_secret: env('GITHUB_CLIENT_SECRET'),
        code,
        redirect_uri: redirectUri,
        code_verifier: pending.verifier,
        repository_id: Number(env('GITHUB_REPOSITORY_ID', '1147572483')),
      }),
    });
    const token = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !token.access_token) return authError('token_exchange');

    const userResponse = await fetch('https://api.github.com/user', {
      headers: githubHeaders(token.access_token),
    });
    if (!userResponse.ok) return authError('user');
    const user = await userResponse.json();
    if (!isAllowedLogin(user.login)) return authError('not_allowed');

    // Force validation of the exactly-one-user configuration before sealing.
    allowedLogin();
    const session = createSession(user.login, token);
    const next = validateNext(pending.next);
    return redirect(`${siteUrl()}${next}`, [sessionCookie(session), stateClear()]);
  } catch {
    return authError('server');
  }
}
