// Dev-only local admin server. Binds 127.0.0.1 — never deployed (not part of
// the Astro build). Start with: npm run admin
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { filmStocks } from '../../src/data/film-stocks.ts';

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
