// Dev-only local admin server. Binds 127.0.0.1 — never deployed (not part of
// the Astro build). Start with: npm run admin
import { createServer } from 'node:http';
import { readFile, writeFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';
import { filmStocks } from '../../src/data/film-stocks.ts';
import sharp from 'sharp';
import { crossOriginError, parseFolderName, parseRollMarkdown, rollInputErrors, validatePreviewPath } from './lib.mjs';
import { writeRollFiles, gitPublish, checkGitHubAuth } from './publish.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const PORT = 4322;
const HOST = '127.0.0.1';
const ALLOWED_HOSTS = [`${HOST}:${PORT}`, `localhost:${PORT}`];

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}

async function readBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  return chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {};
}

// Persistent publish history. Plain text, one event per line, capped at the last
// LOG_MAX lines so the file can never grow without bound. Survives server
// restarts; gitignored (local dev tool, not deployed).
const LOG_FILE = join(__dirname, '.admin.log');
const LOG_MAX = 500;
const readLog = async () =>
  existsSync(LOG_FILE) ? (await readFile(LOG_FILE, 'utf8')).split('\n').filter(Boolean) : [];
async function record(...lines) {
  const ts = new Date().toISOString();
  const all = [...(await readLog()), ...lines.map((l) => `[${ts}] ${l}`)];
  await writeFile(LOG_FILE, all.slice(-LOG_MAX).join('\n') + '\n');
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

route('GET', /^\/api\/logs$/, async (req, res) => {
  send(res, 200, { lines: await readLog() });
});

route('GET', /^\/api\/auth$/, async (req, res) => {
  send(res, 200, await checkGitHubAuth());
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

async function preview(path) {
  const buf = await sharp(path)
    .rotate()
    .resize({ width: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
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

  // sharp schedules work on its own thread pool, so thumbnail all frames
  // concurrently rather than one at a time
  const frames = await Promise.all(
    names.map(async (name) => {
      const srcPath = join(folder, name);
      return { srcPath, thumb: await thumb(srcPath) };
    })
  );
  const parsed = parseFolderName(basename(folder), filmStocks);
  send(res, 200, { parsed, frames });
});

route('POST', /^\/api\/preview$/, async (req, res) => {
  const { path } = await readBody(req);
  const err = validatePreviewPath(path, { imageRe: IMAGE_RE, exists: existsSync });
  if (err) return send(res, 400, { error: err });
  send(res, 200, { src: await preview(path) });
});

const countryCache = new Map(); // country name → { name, lat, lng } | undefined

async function nominatim(query, detail) {
  // accept-language=en so place/country names come back in English (the site's
  // content language), not the location's local script.
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&accept-language=en&limit=5${detail ? '&addressdetails=1' : ''}&q=${encodeURIComponent(query)}`;
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
  const frames = await Promise.all(
    data.photos.map(async (p, i) => {
      const filePath = join(PHOTOS_DIR, slug, `${String(i + 1).padStart(3, '0')}.jpg`);
      return {
        existing: i + 1,
        path: filePath,
        thumb: await thumb(filePath),
        alt: p.alt,
        caption: p.caption ?? '',
        location: p.location ?? null,
      };
    })
  );
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

  const errors = rollInputErrors(body, filmStocks);
  if (errors.length) {
    await record(`publish error: ${errors.join('; ')}`);
    return send(res, 400, { error: errors.join('; ') });
  }

  // Overwrite guard: a write may only land on its own roll. Writing a slug that
  // already belongs to a different roll (a fresh create, or an edit renamed onto
  // another roll's slug) is refused so one roll can never clobber another.
  const isEdit = body.mode === 'edit';
  const targetExists = existsSync(join(CONTENT_DIR, `${slug}.md`));
  if (targetExists && !(isEdit && sourceSlug === slug)) {
    await record(`publish error: roll "${slug}" already exists`);
    return send(res, 409, { error: `roll "${slug}" already exists — choose a different slug, or edit that roll directly` });
  }

  // Auth gate: a commit needs a valid github.com token, or the push fails after
  // the commit has already landed (orphan local commit). Check before writing
  // anything so a failed auth leaves the working tree untouched.
  if (commit) {
    const auth = await checkGitHubAuth();
    if (!auth.ok) {
      await record(`publish error: GitHub ${auth.detail}`);
      return send(res, 401, { error: `GitHub ${auth.detail}`, authFailed: true });
    }
  }

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
  await record(`publish ok: ${slug}${committed ? ' (committed)' : ''}`, ...log);
  send(res, 200, { ok: true, committed, log });
});

const server = createServer(async (req, res) => {
  try {
    // Loopback binding alone doesn't stop the browser being used as a proxy:
    // refuse DNS-rebinding (foreign Host) and cross-site requests (foreign
    // Origin) before touching any route.
    const denied = crossOriginError({ host: req.headers.host, origin: req.headers.origin }, ALLOWED_HOSTS);
    if (denied) return send(res, 403, { error: denied });
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
