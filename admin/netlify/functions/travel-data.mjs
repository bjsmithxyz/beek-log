import { assertValidTrip } from '@beek/shared/trip-validation';
import { env, githubHeaders, json, withSessionCookie } from '../../src/server/auth.mjs';
import { requireGetSession } from '../../src/server/request-guards.mjs';

export default async function travelData(request) {
  const context = await requireGetSession(request);
  if (context.response) return context.response;
  const owner = env('GITHUB_REPOSITORY_OWNER', 'bjsmithxyz');
  const repo = env('GITHUB_REPOSITORY_NAME', 'beek-log');
  const path = 'src/data/trips.json';
  try {
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=main`, {
      headers: githubHeaders(context.session.token),
    });
    if (!response.ok) return withSessionCookie(json(502, { ok: false, error: 'Could not load travel data' }), context.setCookie);
    const file = await response.json();
    if (!/^[0-9a-f]{40}$/.test(file.sha || '') || file.encoding !== 'base64') throw new Error('bad file');
    const trips = JSON.parse(Buffer.from(String(file.content).replace(/\s/g, ''), 'base64').toString('utf8'));
    assertValidTrip(trips);
    return withSessionCookie(json(200, { ok: true, sha: file.sha, trips }), context.setCookie);
  } catch {
    return withSessionCookie(json(502, { ok: false, error: 'Could not load valid travel data' }), context.setCookie);
  }
}
