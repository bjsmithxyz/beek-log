import { filmStocks } from '@beek/shared/film-stocks';
import { buildRollMarkdown, rollInputErrors } from '@beek/shared/roll-markdown';
import { PublishError } from './publisher.mjs';

const SHA = /^[0-9a-f]{40}$/;
const SLUG = /^[a-z0-9-]+$/;
const MAX_FRAMES = 100;
const CONTENT_PREFIX = 'src/content/photos/';
const ASSET_PREFIX = 'src/assets/photos/';

function exactKeys(value, expected, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PublishError(`${label} must be an object.`);
  const actual = Object.keys(value).sort();
  const wanted = [...expected].sort();
  if (actual.length !== wanted.length || actual.some((key, index) => key !== wanted[index])) {
    throw new PublishError(`${label} has unknown or missing fields.`);
  }
}

function location(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new PublishError(`${label} is invalid.`);
  exactKeys(value, value.region ? ['name', 'lat', 'lng', 'region'] : ['name', 'lat', 'lng'], label);
  if (typeof value.name !== 'string' || !value.name.trim() || value.name.length > 160 ||
      !Number.isFinite(value.lat) || value.lat < -90 || value.lat > 90 ||
      !Number.isFinite(value.lng) || value.lng < -180 || value.lng > 180) {
    throw new PublishError(`${label} is invalid.`);
  }
  if (value.region) {
    exactKeys(value.region, ['name', 'lat', 'lng'], `${label} region`);
    if (typeof value.region.name !== 'string' || !value.region.name.trim() || value.region.name.length > 160 ||
        !Number.isFinite(value.region.lat) || value.region.lat < -90 || value.region.lat > 90 ||
        !Number.isFinite(value.region.lng) || value.region.lng < -180 || value.region.lng > 180) {
      throw new PublishError(`${label} region is invalid.`);
    }
  }
  return structuredClone(value);
}

const markdownPath = (slug) => `${CONTENT_PREFIX}${slug}.md`;
const imagePath = (slug, index) => `${ASSET_PREFIX}${slug}/${String(index + 1).padStart(3, '0')}.jpg`;

function sourceData(value) {
  exactKeys(value, ['slug', 'markdownSha', 'frames'], 'Source roll');
  if (!SLUG.test(value.slug || '') || !SHA.test(value.markdownSha || '')) throw new PublishError('Source roll identity is invalid.');
  if (!Array.isArray(value.frames) || value.frames.length < 1 || value.frames.length > MAX_FRAMES) {
    throw new PublishError('Source roll frame inventory is invalid.');
  }
  const frames = value.frames.map((frame, index) => {
    exactKeys(frame, ['path', 'sha'], `Source frame ${index + 1}`);
    if (frame.path !== imagePath(value.slug, index) || !SHA.test(frame.sha || '')) {
      throw new PublishError(`Source frame ${index + 1} inventory is invalid.`);
    }
    return { ...frame };
  });
  return { slug: value.slug, markdownSha: value.markdownSha, frames };
}

function rollData(value, sourceSlug) {
  exactKeys(value, ['slug', 'title', 'stock', 'date', 'location', 'draft', 'body', 'frames'], 'Roll');
  if (!SLUG.test(value.slug || '')) throw new PublishError('Roll slug is invalid.');
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 160) throw new PublishError('Roll title is invalid.');
  if (/[\u0000-\u001f\u007f]/.test(value.title)) throw new PublishError('Roll title is invalid.');
  if (!(value.stock in filmStocks)) throw new PublishError('Film stock is invalid.');
  const parsedDate = typeof value.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.date)
    ? new Date(`${value.date}T00:00:00Z`)
    : null;
  if (!parsedDate || Number.isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== value.date) {
    throw new PublishError('Roll date is invalid.');
  }
  if (typeof value.draft !== 'boolean') throw new PublishError('Roll draft flag is invalid.');
  if (typeof value.body !== 'string' || value.body.length > 20_000) throw new PublishError('Roll notes are too large.');
  const primary = location(value.location, 'Roll location');
  if (!Array.isArray(value.frames) || value.frames.length < 1 || value.frames.length > MAX_FRAMES) {
    throw new PublishError(`Rolls require 1–${MAX_FRAMES} frames.`);
  }
  const frames = value.frames.map((frame, index) => {
    const keys = ['blobSha', 'alt'];
    if (Object.hasOwn(frame || {}, 'caption')) keys.push('caption');
    if (Object.hasOwn(frame || {}, 'location')) keys.push('location');
    exactKeys(frame, keys, `Frame ${index + 1}`);
    if (!SHA.test(frame.blobSha || '')) throw new PublishError(`Frame ${index + 1} blob SHA is invalid.`);
    if (typeof frame.alt !== 'string' || frame.alt.length > 500) throw new PublishError(`Frame ${index + 1} alt text is too long.`);
    if (frame.caption !== undefined && (typeof frame.caption !== 'string' || frame.caption.length > 1_000)) {
      throw new PublishError(`Frame ${index + 1} caption is too long.`);
    }
    return {
      blobSha: frame.blobSha,
      alt: frame.alt,
      ...(frame.caption ? { caption: frame.caption } : {}),
      ...(frame.location ? { location: location(frame.location, `Frame ${index + 1} location`) } : {}),
    };
  });
  const errors = rollInputErrors({
    slug: value.slug,
    sourceSlug,
    stock: value.stock,
    date: value.date,
    location: primary,
    frames,
  }, filmStocks);
  if (errors.length) throw new PublishError(errors[0]);
  return {
    slug: value.slug,
    title: value.title.trim(),
    stock: value.stock,
    date: value.date,
    location: primary,
    draft: value.draft,
    body: value.body,
    frames,
  };
}

function inventoryVerifier({ mode, source, targetSlug }) {
  return (blobs) => {
    const targetImagePrefix = `${ASSET_PREFIX}${targetSlug}/`;
    if (mode === 'create' || (mode === 'edit' && source.slug !== targetSlug)) {
      if (blobs.has(markdownPath(targetSlug)) || [...blobs.keys()].some((path) => path.startsWith(targetImagePrefix))) {
        throw new PublishError(`Roll "${targetSlug}" already exists.`, { status: 409, code: 'stale_content' });
      }
    }
    if (!source) return;
    if (blobs.get(markdownPath(source.slug)) !== source.markdownSha) {
      throw new PublishError(`Roll "${source.slug}" changed since it was loaded.`, { status: 409, code: 'stale_content' });
    }
    const prefix = `${ASSET_PREFIX}${source.slug}/`;
    const actual = [...blobs.entries()]
      .filter(([path]) => path.startsWith(prefix))
      .sort(([a], [b]) => a.localeCompare(b));
    if (actual.length !== source.frames.length || actual.some(([path, sha], index) => (
      path !== source.frames[index].path || sha !== source.frames[index].sha
    ))) {
      throw new PublishError(`Roll "${source.slug}" frame inventory changed since it was loaded.`, { status: 409, code: 'stale_content' });
    }
  };
}

function rollPolicy(plan) {
  return {
    maxOperations: 2 * MAX_FRAMES + 2,
    maxFileBytes: 256 * 1024,
    maxTotalBytes: 256 * 1024,
    allows(path) {
      return /^src\/content\/photos\/[a-z0-9-]+\.md$/.test(path) ||
        /^src\/assets\/photos\/[a-z0-9-]+\/\d{3}\.jpg$/.test(path);
    },
    verifyCurrent: inventoryVerifier(plan),
  };
}

export function rollPublication(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new PublishError('Request must be an object.');
  const mode = body.mode;
  if (!['create', 'edit', 'delete'].includes(mode)) throw new PublishError('Roll publication mode is invalid.');
  exactKeys(body,
    mode === 'create' ? ['requestId', 'mode', 'roll'] :
      mode === 'edit' ? ['requestId', 'mode', 'source', 'roll'] :
        ['requestId', 'mode', 'source'],
    'Request');

  const source = mode === 'create' ? null : sourceData(body.source);
  const roll = mode === 'delete' ? null : rollData(body.roll, source?.slug);
  const targetSlug = roll?.slug || source.slug;
  const operations = [];

  if (mode === 'delete') {
    operations.push({ action: 'delete', path: markdownPath(source.slug), expectedSha: source.markdownSha });
    source.frames.forEach((frame) => operations.push({ action: 'delete', path: frame.path, expectedSha: frame.sha }));
  } else {
    const sameTarget = mode === 'edit' && source.slug === roll.slug;
    roll.frames.forEach((frame, index) => {
      const path = imagePath(roll.slug, index);
      const existing = sameTarget ? source.frames[index] : null;
      operations.push(existing
        ? { action: 'update', path, expectedSha: existing.sha, blobSha: frame.blobSha }
        : { action: 'create', path, blobSha: frame.blobSha });
    });
    if (sameTarget) {
      source.frames.slice(roll.frames.length).forEach((frame) => {
        operations.push({ action: 'delete', path: frame.path, expectedSha: frame.sha });
      });
    }

    const photos = roll.frames.map((frame, index) => ({
      src: `../../assets/photos/${roll.slug}/${String(index + 1).padStart(3, '0')}.jpg`,
      alt: frame.alt,
      ...(frame.caption ? { caption: frame.caption } : {}),
      ...(frame.location ? { location: frame.location } : {}),
    }));
    const markdown = buildRollMarkdown({
      title: roll.title,
      stock: roll.stock,
      date: roll.date,
      location: roll.location,
      draft: roll.draft,
      photos,
      body: roll.body,
    });
    operations.push(sameTarget
      ? { action: 'update', path: markdownPath(roll.slug), expectedSha: source.markdownSha, content: markdown }
      : { action: 'create', path: markdownPath(roll.slug), content: markdown });

    if (mode === 'edit' && !sameTarget) {
      operations.push({ action: 'delete', path: markdownPath(source.slug), expectedSha: source.markdownSha });
      source.frames.forEach((frame) => operations.push({ action: 'delete', path: frame.path, expectedSha: frame.sha }));
    }
  }

  const verb = mode === 'create' ? 'Add' : mode === 'edit' ? 'Update' : 'Delete';
  const title = `${verb} ${mode === 'delete' ? source.slug : roll.title} film roll`;
  const input = {
    requestId: body.requestId,
    resource: 'rolls',
    title,
    message: `${title} via admin`,
    operations,
  };
  return {
    input,
    policy: rollPolicy({ mode, source, targetSlug }),
    summary: { mode, slug: targetSlug, frames: roll?.frames.length || source.frames.length },
  };
}
