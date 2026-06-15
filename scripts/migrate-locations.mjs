// One-time backfill: give existing roll/photo locations a `region` (country) and
// a clean, English place `name`. The legacy names are raw Nominatim strings in
// the location's own script (e.g. "เกาะสมุย, ประเทศไทย"); reverse-geocoding the
// stored coordinates with accept-language=en yields English place + country
// labels, and the country is forward-geocoded once for the region pin's
// coordinates. Original coordinates are preserved. Dry-run by default; pass
// --write to apply. Run: node scripts/migrate-locations.mjs [--write]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseRollMarkdown, buildRollMarkdown } from './admin/lib.mjs';

const WRITE = process.argv.includes('--write');
const CONTENT_DIR = join(process.cwd(), 'src/content/photos');
const UA = { 'User-Agent': 'beek-log-migrate (local dev tool)' };

const polite = () => new Promise((res) => setTimeout(res, 1100)); // Nominatim rate limit

const reverseCache = new Map(); // "lat,lng" → address | null
async function reverse(lat, lng) {
  const key = `${lat},${lng}`;
  if (reverseCache.has(key)) return reverseCache.get(key);
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&accept-language=en&addressdetails=1&lat=${lat}&lon=${lng}`;
  let address = null;
  try {
    const r = await fetch(url, { headers: UA });
    if (r.ok) address = (await r.json()).address || null;
  } catch { address = null; }
  reverseCache.set(key, address);
  await polite();
  return address;
}

const countryCache = new Map(); // country name → { name, lat, lng } | undefined
async function geocodeCountry(country) {
  if (countryCache.has(country)) return countryCache.get(country);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=en&limit=1&q=${encodeURIComponent(country)}`;
  let region;
  try {
    const r = await fetch(url, { headers: UA });
    const [c] = r.ok ? await r.json() : [];
    region = c ? { name: country, lat: Number(c.lat), lng: Number(c.lon) } : undefined;
  } catch { region = undefined; }
  countryCache.set(country, region);
  await polite();
  return region;
}

function placeName(address, fallback) {
  const a = address || {};
  return a.city || a.town || a.village || a.hamlet || a.county || a.state || fallback;
}

async function migrateLocation(loc) {
  if (!loc || loc.region) return loc;
  const address = await reverse(loc.lat, loc.lng);
  const country = address && address.country;
  if (!country) return loc; // reverse failed — leave untouched
  const region = await geocodeCountry(country);
  if (!region) return loc;
  const fallback = String(loc.name).split(',')[0].trim();
  return { name: placeName(address, fallback), lat: loc.lat, lng: loc.lng, region };
}

const files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.md'));
for (const file of files) {
  const path = join(CONTENT_DIR, file);
  const { data, body } = parseRollMarkdown(await readFile(path, 'utf8'));
  const before = JSON.stringify(data.location);
  const location = await migrateLocation(data.location);
  const photos = [];
  for (const p of data.photos) {
    photos.push({ ...p, location: p.location ? await migrateLocation(p.location) : undefined });
  }
  const changed = before !== JSON.stringify(location) || data.photos.some((p, i) => JSON.stringify(p.location) !== JSON.stringify(photos[i].location));
  if (!changed) { console.log(`· ${file}: no change`); continue; }
  console.log(`✎ ${file}: ${data.location.name}  →  ${location.name} · ${location.region ? location.region.name : '(none)'}`);
  if (WRITE) {
    const md = buildRollMarkdown({
      title: data.title, stock: data.stock, date: String(data.date).slice(0, 10),
      location, draft: !!data.draft, photos, body,
    });
    await writeFile(path, md, 'utf8');
  }
}
console.log(WRITE ? '\nwrote changes' : '\ndry-run — re-run with --write to apply');
