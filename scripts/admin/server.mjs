// Dev-only local admin server. Binds 127.0.0.1 — never deployed (not part of
// the Astro build). Start with: npm run admin
import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { basename, dirname, join } from 'node:path';
import { filmStocks } from '../../src/data/film-stocks.ts';
import sharp from 'sharp';
import { parseFolderName } from './lib.mjs';

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

route('POST', /^\/api\/geocode$/, async (req, res) => {
  const { query } = await readBody(req);
  if (!query || !query.trim()) return send(res, 400, { error: 'query required' });
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=5&q=${encodeURIComponent(query)}`;
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'beek-log-admin (local dev tool)' } });
    if (!r.ok) return send(res, 502, { error: `geocoder ${r.status}` });
    const data = await r.json();
    send(res, 200, data.map((d) => ({
      name: d.display_name,
      lat: Number(d.lat),
      lng: Number(d.lon),
    })));
  } catch (err) {
    send(res, 502, { error: `geocode failed: ${err.message}` });
  }
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
