// Pure folder-name parsing for the roll authoring flow.
//
// Convention: "YYYY-MM-DD - <film-stock-slug>-<ISO>", where ISO is the ISO 3166
// country code the roll was shot in. That exact shape is what the hint in the
// editor asks for, but scan folders come off a scanner and a card reader with
// whatever name they were given, so nothing here *requires* it: the date, the
// stock and the country code are each recovered independently from anywhere in
// the name. A folder that follows the convention parses exactly as before; one
// that only half-follows it now yields what it can instead of nothing.
import { slugify } from './slug.mjs';

const DATE = /\d{4}-\d{2}-\d{2}/;
// The country code is conventionally the final token, and must stay anchored
// there — an unanchored search would read the "DE" out of a stock name.
const TRAILING_ISO = /[-\s]([A-Z]{2,3})\s*$/;

function realDate(value) {
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? null : (date.toISOString().slice(0, 10) === value ? value : null);
}

function regionName(iso) {
  try {
    const displayName = new Intl.DisplayNames(['en'], { type: 'region' }).of(iso);
    return displayName && displayName !== iso ? displayName : null;
  } catch {
    // Structurally invalid region codes throw rather than returning undefined.
    return null;
  }
}

/** Longest known stock slug appearing as a whole run of tokens in the name. */
function findStock(name, filmStocks) {
  const haystack = `-${slugify(name)}-`;
  let found = null;
  for (const slug of Object.keys(filmStocks)) {
    if (haystack.includes(`-${slug}-`) && (!found || slug.length > found.length)) found = slug;
  }
  return found;
}

export function parseFolderName(name, filmStocks = {}) {
  const raw = String(name || '');
  const result = { date: null, stockSlug: null, iso: null, country: null };

  const date = raw.match(DATE);
  if (date) result.date = realDate(date[0]);

  const iso = raw.match(TRAILING_ISO);
  if (iso) {
    result.iso = iso[1];
    result.country = regionName(iso[1]);
  }

  result.stockSlug = findStock(raw, filmStocks);
  return result;
}
