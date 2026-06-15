// One-time backfill: give existing roll/photo locations a `region` (country) and
// a clean place `name`, derived from the comma parts of the current name, with
// the country geocoded for coordinates. Dry-run by default; pass --write to
// apply. Run: node scripts/migrate-locations.mjs [--write]
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parseRollMarkdown, buildRollMarkdown } from './admin/lib.mjs';

const WRITE = process.argv.includes('--write');
const CONTENT_DIR = join(process.cwd(), 'src/content/photos');
const countryCache = new Map();

async function geocodeCountry(country) {
  if (countryCache.has(country)) return countryCache.get(country);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=en&limit=1&q=${encodeURIComponent(country)}`;
  let region;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'beek-log-migrate (local dev tool)' } });
    const [c] = r.ok ? await r.json() : [];
    region = c ? { name: country, lat: Number(c.lat), lng: Number(c.lon) } : undefined;
  } catch { region = undefined; }
  countryCache.set(country, region);
  await new Promise((res) => setTimeout(res, 1100)); // be polite to Nominatim
  return region;
}

async function migrateLocation(loc) {
  if (!loc || loc.region) return loc;
  const parts = String(loc.name).split(',').map((s) => s.trim()).filter(Boolean);
  if (parts.length < 2) return loc; // nothing to split → leave standalone
  const country = parts[parts.length - 1];
  const region = await geocodeCountry(country);
  if (!region) return loc;
  return { name: parts[0], lat: loc.lat, lng: loc.lng, region };
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
