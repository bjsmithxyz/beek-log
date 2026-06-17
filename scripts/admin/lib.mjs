// Pure helpers for the roll-import admin. No I/O, no Astro imports.
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';

// Folder convention: "YYYY-MM-DD - <film-stock-slug>-<ISO>"
// e.g. "2026-06-02 - kodak-portra-400-PT"
export function parseFolderName(name, filmStocks = {}) {
  const result = { date: null, stockSlug: null, iso: null, country: null };
  const parts = name.split(' - ');
  if (parts.length < 2) return result;

  const datePart = parts[0].trim();
  const rest = parts.slice(1).join(' - ').trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) result.date = datePart;

  const m = rest.match(/^(.*)-([A-Z]{2,3})$/);
  if (m) {
    const [, stock, iso] = m;
    result.iso = iso;
    if (stock in filmStocks) result.stockSlug = stock;
    try {
      const displayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(iso);
      result.country = displayName && displayName !== iso ? displayName : null;
    } catch {
      result.country = null;
    }
  } else if (rest in filmStocks) {
    result.stockSlug = rest;
  }
  return result;
}

export function slugify(s) {
  return String(s)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function deriveSlug({ date, stockSlug, placeName }) {
  const ym = (date || '').slice(0, 7); // YYYY-MM
  const place = slugify((placeName || '').split(',')[0] || '');
  return [ym, stockSlug, place].filter(Boolean).join('-');
}

function locationFM(loc) {
  const o = { name: loc.name, lat: loc.lat, lng: loc.lng };
  if (loc.region) o.region = { name: loc.region.name, lat: loc.region.lat, lng: loc.region.lng };
  return o;
}

function sameRegion(a, b) {
  if (!a && !b) return true;
  return !!a && !!b && a.name === b.name && a.lat === b.lat && a.lng === b.lng;
}

function sameLocation(a, b) {
  return a && b && a.name === b.name && a.lat === b.lat && a.lng === b.lng && sameRegion(a.region, b.region);
}

export function buildRollMarkdown({ title, stock, date, location, draft, photos, body = '' }) {
  const fm = {
    title,
    stock,
    date,
    location: locationFM(location),
  };
  if (draft) fm.draft = true;
  fm.photos = photos.map((p) => {
    const o = { src: p.src, alt: p.alt };
    if (p.caption) o.caption = p.caption;
    if (p.location && !sameLocation(p.location, location)) {
      o.location = locationFM(p.location);
    }
    return o;
  });
  const yaml = stringifyYaml(fm).trimEnd();
  return `---\n${yaml}\n---\n\n${String(body).trim()}\n`;
}

export function parseRollMarkdown(text) {
  const m = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!m) throw new Error('no frontmatter found');
  return { data: parseYaml(m[1]), body: (m[2] || '').trim() };
}

// Field validation for a publish request. Pure: takes the request body and the
// stock map, returns error strings. Alt text is intentionally NOT required.
export function rollInputErrors({ slug, sourceSlug, stock, date, location, frames }, filmStocks = {}) {
  const errors = [];
  if (!/^[a-z0-9-]+$/.test(slug || '')) errors.push('slug must match [a-z0-9-]');
  if (sourceSlug && !/^[a-z0-9-]+$/.test(sourceSlug)) errors.push('sourceSlug must match [a-z0-9-]');
  if (!(stock in filmStocks)) errors.push(`unknown stock: ${stock}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) errors.push('date must be YYYY-MM-DD');
  if (!location || !location.name || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    errors.push('roll location needs name + numeric lat/lng');
  }
  const badRegion = (l) => l && l.region && (!l.region.name || !Number.isFinite(l.region.lat) || !Number.isFinite(l.region.lng));
  if (badRegion(location)) errors.push('roll region invalid');
  if (!Array.isArray(frames) || frames.length === 0) errors.push('at least one frame required');
  (frames || []).forEach((f, i) => {
    if (f.location && (!f.location.name || !Number.isFinite(f.location.lat) || !Number.isFinite(f.location.lng))) {
      errors.push(`frame ${i + 1} location invalid`);
    }
    if (badRegion(f.location)) errors.push(`frame ${i + 1} region invalid`);
  });
  return errors;
}
