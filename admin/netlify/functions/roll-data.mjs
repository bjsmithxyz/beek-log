import { parseRollMarkdown } from '@beek/shared/roll-markdown';
import { json, withSessionCookie } from '../../src/server/auth.mjs';
import { rawFileUrl, readMainTree, readTextBlob } from '../../src/server/repository-reader.mjs';
import { requireGetSession } from '../../src/server/request-guards.mjs';

const SLUG = /^[a-z0-9-]+$/;

export default async function rollData(request) {
  const context = await requireGetSession(request);
  if (context.response) return context.response;
  const slug = new URL(request.url).searchParams.get('slug');
  if (!SLUG.test(slug || '')) {
    return withSessionCookie(json(400, { ok: false, error: 'Roll slug is invalid' }), context.setCookie);
  }
  try {
    const { commitSha, entries } = await readMainTree(context.session.token);
    const markdownPath = `src/content/photos/${slug}.md`;
    const markdown = entries.find((entry) => entry.type === 'blob' && entry.path === markdownPath);
    if (!markdown) return withSessionCookie(json(404, { ok: false, error: 'Roll not found' }), context.setCookie);
    const parsed = parseRollMarkdown(await readTextBlob(markdown.sha, context.session.token));
    const prefix = `src/assets/photos/${slug}/`;
    const images = entries
      .filter((entry) => entry.type === 'blob' && entry.path.startsWith(prefix) && /^\d{3}\.jpg$/.test(entry.path.slice(prefix.length)))
      .sort((a, b) => a.path.localeCompare(b.path));
    if (!Array.isArray(parsed.data.photos) || images.length !== parsed.data.photos.length ||
        images.some((entry, index) => entry.path !== `${prefix}${String(index + 1).padStart(3, '0')}.jpg`)) {
      throw new Error('Roll frame inventory is inconsistent');
    }
    const frames = images.map((entry, index) => ({
      path: entry.path,
      blobSha: entry.sha,
      imageUrl: rawFileUrl(commitSha, entry.path),
      alt: parsed.data.photos[index].alt || '',
      ...(parsed.data.photos[index].caption ? { caption: parsed.data.photos[index].caption } : {}),
      ...(parsed.data.photos[index].location ? { location: parsed.data.photos[index].location } : {}),
    }));
    return withSessionCookie(json(200, {
      ok: true,
      roll: {
        slug,
        markdownSha: markdown.sha,
        sourceFrames: images.map((entry) => ({ path: entry.path, sha: entry.sha })),
        title: parsed.data.title,
        stock: parsed.data.stock,
        date: String(parsed.data.date).slice(0, 10),
        location: parsed.data.location,
        draft: Boolean(parsed.data.draft),
        body: parsed.body,
        frames,
      },
    }), context.setCookie);
  } catch {
    return withSessionCookie(json(502, { ok: false, error: 'Could not load a valid film roll' }), context.setCookie);
  }
}
