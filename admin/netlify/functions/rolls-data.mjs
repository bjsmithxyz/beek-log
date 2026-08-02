import { json, withSessionCookie } from '../../src/server/auth.mjs';
import { readMainTree } from '../../src/server/repository-reader.mjs';
import { requireGetSession } from '../../src/server/request-guards.mjs';

export default async function rollsData(request) {
  const context = await requireGetSession(request);
  if (context.response) return context.response;
  try {
    const { entries } = await readMainTree(context.session.token);
    const rolls = entries
      .filter((entry) => entry.type === 'blob' && /^src\/content\/photos\/[a-z0-9-]+\.md$/.test(entry.path))
      .map((entry) => ({
        slug: entry.path.slice('src/content/photos/'.length, -3),
        markdownSha: entry.sha,
      }))
      .sort((a, b) => b.slug.localeCompare(a.slug));
    return withSessionCookie(json(200, { ok: true, rolls }), context.setCookie);
  } catch {
    return withSessionCookie(json(502, { ok: false, error: 'Could not load film rolls' }), context.setCookie);
  }
}
