// Loads one production build under two browser clocks. The current stop and
// day count must change without rebuilding.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import puppeteer from 'puppeteer';

const root = new URL('../dist/', import.meta.url).pathname;
const types = {
  '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
};

const server = createServer(async (request, response) => {
  try {
    let pathname = decodeURIComponent(new URL(request.url, 'http://127.0.0.1').pathname);
    let path = normalize(join(root, pathname));
    if (!path.startsWith(root)) throw new Error('bad path');
    const info = await stat(path).catch(() => null);
    if (info?.isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    response.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' });
    response.end(body);
  } catch {
    response.writeHead(404).end('not found');
  }
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const { port } = server.address();
const browser = await puppeteer.launch({ headless: true });

async function stateAt(iso) {
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (request) => {
    const url = request.url();
    if (url.startsWith(`http://127.0.0.1:${port}`)) request.continue();
    else request.abort();
  });
  await page.evaluateOnNewDocument((value) => {
    const NativeDate = Date;
    const fixed = new NativeDate(`${value}T12:00:00`);
    globalThis.Date = class extends NativeDate {
      constructor(...args) { super(...(args.length ? args : [fixed.getTime()])); }
      static now() { return fixed.getTime(); }
    };
  }, iso);
  await page.goto(`http://127.0.0.1:${port}/travel/`, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.querySelector('#travel-day')?.textContent?.trim(), { timeout: 10_000 });
  const state = await page.evaluate(() => ({
    day: document.querySelector('#travel-day')?.textContent?.trim(),
    current: document.querySelector('.timeline-row.current strong')?.textContent?.trim(),
  }));
  await page.close();
  return state;
}

try {
  const early = await stateAt('2025-06-21');
  const later = await stateAt('2026-08-02');
  assert.match(early.current || '', /Bangkok/);
  assert.match(later.current || '', /Amsterdam/);
  assert.notEqual(early.day, later.day);
  console.log(`travel clock guard: day ${early.day} (${early.current}) -> day ${later.day} (${later.current})`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
