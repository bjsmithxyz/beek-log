import { parseRollMarkdown } from '@beek/shared/roll-markdown';
import { json, withSessionCookie } from '../../src/server/auth.mjs';
import { readMainTree, readTextBlob } from '../../src/server/repository-reader.mjs';
import { requireGetSession } from '../../src/server/request-guards.mjs';

// Best-effort per-roll frontmatter read for the stats line at the top of
// /rolls/ — a malformed roll is skipped rather than failing the whole list.
async function rollStats(entry, token) {
  try {
    const { data } = parseRollMarkdown(await readTextBlob(entry.sha, token));
    const photos = Array.isArray(data.photos) ? data.photos : [];
    return {
      stock: data.stock,
      frames: photos.length,
      selects: photos.filter((photo) => photo.featured).length,
    };
  } catch {
    return null;
  }
}

export default async function rollsData(request) {
  const context = await requireGetSession(request);
  if (context.response) return context.response;
  try {
    const { entries } = await readMainTree(context.session.token);
    const rollEntries = entries.filter((entry) => entry.type === 'blob' && /^src\/content\/photos\/[a-z0-9-]+\.md$/.test(entry.path));
    const rolls = rollEntries
      .map((entry) => ({
        slug: entry.path.slice('src/content/photos/'.length, -3),
        markdownSha: entry.sha,
      }))
      .sort((a, b) => b.slug.localeCompare(a.slug));

    const perRoll = (await Promise.all(rollEntries.map((entry) => rollStats(entry, context.session.token)))).filter(Boolean);
    const stocks = new Set(perRoll.map((roll) => roll.stock));
    const stats = {
      rolls: rolls.length,
      frames: perRoll.reduce((sum, roll) => sum + roll.frames, 0),
      stocks: stocks.size,
      selects: perRoll.reduce((sum, roll) => sum + roll.selects, 0),
    };

    return withSessionCookie(json(200, { ok: true, rolls, stats }), context.setCookie);
  } catch {
    return withSessionCookie(json(502, { ok: false, error: 'Could not load film rolls' }), context.setCookie);
  }
}
