// Dev-only local admin server. Binds 127.0.0.1 — never deployed (not part of
// the Astro build). Start with: npm run admin
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';
import { filmStocks } from '../../src/data/film-stocks.ts';
import sharp from 'sharp';
import { parseFolderName, parseRollMarkdown } from './lib.mjs';
import { writeRollFiles, gitPublish } from './publish.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const PORT = 4322;
const HOST = '127.0.0.1';

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

const routes = [];
const route = (method, pattern, handler) => routes.push({ method, pattern, handler });

route('GET', /^\/$/, async (req, res) => {
  send(res, 200, await readFile(join(__dirname, 'index.html')), 'text/html; charset=utf-8');
});

route('GET', /^\/global\.css$/, async (req, res) => {
  send(res, 200, await readFile(join(repoRoot, 'src/styles/global.css')), 'text/css');
});

route('GET', /^\/favicon\.svg$/, async (req, res) => {
  send(res, 200, await readFile(join(__dirname, 'favicon.svg')), 'image/svg+xml');
});

route('GET', /^\/api\/config$/, async (req, res) => {
  const stocks = Object.entries(filmStocks).map(([slug, v]) => ({ slug, name: v.name, type: v.type }));
  send(res, 200, { stocks });
});

const IMAGE_RE = /\.(jpe?g|png|tiff?|webp)$/i;

async function thumb(path) {
  const buf = await sharp(path)
    .rotate()
    .resize({ width: 220, height: 220, fit: 'inside' })
    .jpeg({ quality: 60 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}

route('POST', /^\/api\/scan$/, async (req, res) => {
  const { folder } = await readBody(req);
  if (!folder) return send(res, 400, { error: 'folder required' });
  let names;
  try {
    names = (await readdir(folder)).filter((f) => IMAGE_RE.test(f)).sort();
  } catch {
    return send(res, 400, { error: `cannot read folder: ${folder}` });
  }
  if (names.length === 0) return send(res, 400, { error: 'no images found in folder' });

  const frames = [];
  for (const name of names) {
    const srcPath = join(folder, name);
    frames.push({ srcPath, thumb: await thumb(srcPath) });
  }
  const parsed = parseFolderName(basename(folder), filmStocks);
  send(res, 200, { parsed, frames });
});

const countryCache = new Map(); // country name → { name, lat, lng } | undefined

async function nominatim(query, detail) {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5${detail ? '&addressdetails=1' : ''}&q=${encodeURIComponent(query)}`;
  const r = await fetch(url, { headers: { 'User-Agent': 'beek-log-admin (local dev tool)' } });
  if (!r.ok) throw new Error(`geocoder ${r.status}`);
  return r.json();
}

function placeName(d) {
  const a = d.address || {};
  return a.city || a.town || a.village || a.hamlet || a.state || (d.display_name || '').split(',')[0].trim();
}

async function regionFor(address) {
  const country = address && address.country;
  if (!country) return undefined;
  if (countryCache.has(country)) return countryCache.get(country);
  let region;
  try {
    const [c] = await nominatim(country, false);
    region = c ? { name: country, lat: Number(c.lat), lng: Number(c.lon) } : undefined;
  } catch {
    region = undefined;
  }
  countryCache.set(country, region);
  return region;
}

route('POST', /^\/api\/geocode$/, async (req, res) => {
  const { query } = await readBody(req);
  if (!query || !query.trim()) return send(res, 400, { error: 'query required' });
  try {
    const data = await nominatim(query, true);
    const results = [];
    for (const d of data) {
      results.push({
        name: placeName(d),
        lat: Number(d.lat),
        lng: Number(d.lon),
        region: await regionFor(d.address),
      });
    }
    send(res, 200, results);
  } catch (err) {
    send(res, 502, { error: `geocode failed: ${err.message}` });
  }
});

const CONTENT_DIR = join(repoRoot, 'src/content/photos');
const PHOTOS_DIR = join(repoRoot, 'src/assets/photos');

route('GET', /^\/api\/rolls$/, async (req, res) => {
  let files = [];
  try {
    files = (await readdir(CONTENT_DIR)).filter((f) => f.endsWith('.md'));
  } catch { /* no rolls yet */ }
  const rolls = [];
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const { data } = parseRollMarkdown(await readFile(join(CONTENT_DIR, file), 'utf8'));
    rolls.push({
      slug, title: data.title, stock: data.stock, date: data.date,
      frameCount: data.photos.length, draft: !!data.draft,
    });
  }
  rolls.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  send(res, 200, rolls);
});

route('GET', /^\/api\/roll\/([a-z0-9-]+)$/, async (req, res) => {
  const slug = req.params[1];
  let text;
  try {
    text = await readFile(join(CONTENT_DIR, `${slug}.md`), 'utf8');
  } catch {
    return send(res, 404, { error: `no roll ${slug}` });
  }
  const { data, body } = parseRollMarkdown(text);
  const frames = [];
  for (let i = 0; i < data.photos.length; i++) {
    const p = data.photos[i];
    const filePath = join(PHOTOS_DIR, slug, `${String(i + 1).padStart(3, '0')}.jpg`);
    frames.push({
      existing: i + 1,
      thumb: await thumb(filePath),
      alt: p.alt,
      caption: p.caption ?? '',
      location: p.location ?? null,
    });
  }
  send(res, 200, {
    slug,
    meta: { title: data.title, stock: data.stock, date: String(data.date).slice(0, 10), location: data.location, draft: !!data.draft },
    body,
    frames,
  });
});

route('GET', /^\/app\.js$/, async (req, res) => {
  send(res, 200, await readFile(join(__dirname, 'app.js')), 'text/javascript');
});

route('GET', /^\/loc-utils\.mjs$/, async (req, res) => {
  send(res, 200, await readFile(join(__dirname, 'loc-utils.mjs')), 'text/javascript');
});

route('POST', /^\/api\/publish$/, async (req, res) => {
  const body = await readBody(req);
  const { slug, sourceSlug, title, stock, date, location, draft, frames, commit, bodyText = '' } = body;

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
    if (!f.alt || !f.alt.trim()) errors.push(`frame ${i + 1} needs alt text`);
    if (f.location && (!f.location.name || !Number.isFinite(f.location.lat) || !Number.isFinite(f.location.lng))) {
      errors.push(`frame ${i + 1} location invalid`);
    }
    if (badRegion(f.location)) errors.push(`frame ${i + 1} region invalid`);
  });
  if (errors.length) return send(res, 400, { error: errors.join('; ') });

  const log = [];
  const written = await writeRollFiles({
    repoRoot, slug, body: bodyText,
    sourceSlug: body.mode === 'edit' ? (sourceSlug || slug) : slug,
    meta: { title, stock, date, location, draft },
    frames,
  });
  log.push(`wrote ${written.frameCount} frames → ${written.photosDir}`);
  log.push(`wrote ${written.contentFile}`);
  if (written.removed.length) log.push(`removed old roll → ${written.removed.join(', ')}`);

  let committed = false;
  if (commit) {
    const message = `${body.mode === 'edit' ? 'Update' : 'Add'} ${title} roll (${filmStocks[stock].name})`;
    const gitLog = await gitPublish({
      repoRoot,
      paths: [written.photosDir, written.contentFile, ...written.removed],
      message,
    });
    log.push(...gitLog);
    committed = true;
  }
  send(res, 200, { ok: true, committed, log });
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    const match = routes.find((r) => r.method === req.method && r.pattern.test(url.pathname));
    if (!match) return send(res, 404, { error: 'not found' });
    req.params = url.pathname.match(match.pattern);
    await match.handler(req, res);
  } catch (err) {
    send(res, 500, { error: String(err && err.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`admin → http://${HOST}:${PORT}  (Ctrl-C to stop)`);
});
