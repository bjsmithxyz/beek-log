# Roll-import Admin + Homepage Rolls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dev-only local web app (`npm run admin`) to create and edit film rolls — scan a folder, drag-reorder frames, derive metadata from the folder name, geocode locations (including per-photo location), then write the resized frames + roll `.md` and commit/push — and surface recent rolls on the homepage.

**Architecture:** A standalone localhost Node HTTP server (`scripts/admin/server.mjs`) serving a vanilla-JS page (`scripts/admin/index.html`), backed by pure helpers (`scripts/admin/lib.mjs`) and file/git logic (`scripts/admin/publish.mjs`). It is not part of the Astro build graph, so it can never deploy. The Astro site gains an optional per-photo `location` field and a shared `effectiveLocations()` helper used by the map, roll page, and a new homepage `rolls/` section.

**Tech Stack:** Astro 5, sharp, Node built-ins (`http`, `child_process`, `fs`, global `fetch`, `Intl.DisplayNames`), `yaml` (dev), `node:test`. No new runtime dependencies.

**Spec:** `docs/superpowers/specs/2026-06-13-roll-import-admin-design.md`

---

## File Structure

| File | Responsibility |
|---|---|
| `package.json` | add `admin` + `test` scripts, `yaml` devDependency |
| `src/content/config.ts` | add optional per-photo `location` to photos schema |
| `src/data/locations.ts` | `effectiveLocations(roll)` — pure, no Astro imports |
| `src/data/locations.test.mjs` | tests for `effectiveLocations` |
| `scripts/admin/lib.mjs` | pure: `parseFolderName`, `slugify`, `deriveSlug`, `buildRollMarkdown`, `parseRollMarkdown` |
| `scripts/admin/lib.test.mjs` | tests for lib |
| `scripts/admin/publish.mjs` | `writeRollFiles` (sharp+fs, temp-dir swap), `gitPublish` |
| `scripts/admin/publish.test.mjs` | tests for `writeRollFiles` |
| `scripts/admin/server.mjs` | localhost HTTP server + endpoints |
| `scripts/admin/index.html` | single-page admin UI |
| `src/pages/index.astro` | add `rolls/` section |
| `src/pages/photos/index.astro` | build map pins from `effectiveLocations` |
| `src/pages/photos/[roll].astro` | lightbox meta = per-photo effective location |
| `src/components/RollRow.astro` | show primary location + `+N` suffix |
| `README.md` | document `npm run admin`; drop `import-roll.mjs` |
| `scripts/import-roll.mjs` | **deleted** (superseded) |

---

## Task 1: Tooling — scripts and dev dependency

**Files:**
- Modify: `package.json:5-18`

- [ ] **Step 1: Install `yaml` as a devDependency**

Run: `npm install --save-dev yaml`
Expected: `package.json` gains a `devDependencies` block with `yaml`; lockfile updates.

- [ ] **Step 2: Add `admin` and `test` scripts**

Edit `package.json` `scripts` to:

```json
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "astro": "astro",
    "admin": "node scripts/admin/server.mjs",
    "test": "node --test"
  },
```

- [ ] **Step 3: Verify scripts resolve**

Run: `npm run test`
Expected: exits 0 with "tests 0" (no test files yet) — confirms the runner works.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json
git commit -m "Add admin + test npm scripts and yaml devDependency"
```

---

## Task 2: Per-photo location in the photos schema

**Files:**
- Modify: `src/content/config.ts:29-49`

- [ ] **Step 1: Replace the photos collection with a shared location schema and optional per-photo override**

Replace lines 29-49 (`const photosCollection = …` through its closing `});`) with:

```ts
// One file per film roll: src/content/photos/<roll-slug>.md
// Photos live in src/assets/photos/<roll-slug>/; markdown body = roll notes.
const locationSchema = z.object({
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const photosCollection = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    title: z.string(),
    stock: z.string().refine((s): s is keyof typeof filmStocks => s in filmStocks, {
      message: 'unknown film stock slug — add it to src/data/film-stocks.ts',
    }),
    date: z.coerce.date(),
    location: locationSchema,
    draft: z.boolean().default(false),
    photos: z.array(z.object({
      src: image(),
      alt: z.string(),
      caption: z.string().optional(),
      location: locationSchema.optional(),
    })).min(1),
  }),
});
```

- [ ] **Step 2: Verify the schema still validates the existing sample roll**

Run: `npm run build`
Expected: "Complete!" with no content-collection errors (the sample roll has no per-photo location, which is now optional).

- [ ] **Step 3: Commit**

```bash
git add src/content/config.ts
git commit -m "Add optional per-photo location to photos collection"
```

---

## Task 3: `effectiveLocations` shared helper

**Files:**
- Create: `src/data/locations.ts`
- Test: `src/data/locations.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `src/data/locations.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { effectiveLocations } from './locations.ts';

const cn = { name: 'Shenzhen, China', lat: 22.5, lng: 114.05 };
const hk = { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 };

test('single roll location → one entry counting all photos', () => {
  const roll = { data: { location: cn, photos: [{}, {}, {}] } };
  assert.deepEqual(effectiveLocations(roll), [{ ...cn, count: 3 }]);
});

test('per-photo overrides produce multiple de-duped entries', () => {
  const roll = { data: { location: cn, photos: [{}, { location: hk }, { location: hk }] } };
  assert.deepEqual(effectiveLocations(roll), [
    { ...cn, count: 1 },
    { ...hk, count: 2 },
  ]);
});

test('de-dup is case-insensitive on name', () => {
  const roll = {
    data: {
      location: cn,
      photos: [{ location: { ...hk, name: 'hong kong' } }, { location: hk }],
    },
  };
  assert.equal(effectiveLocations(roll).length, 1);
  assert.equal(effectiveLocations(roll)[0].count, 2);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test src/data/locations.test.mjs`
Expected: FAIL — cannot find module `./locations.ts`.

- [ ] **Step 3: Implement `src/data/locations.ts`**

Create `src/data/locations.ts` (no `astro:content` import — structural types so the test can import it):

```ts
export interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface RollLike {
  data: {
    location: Location;
    photos: { location?: Location }[];
  };
}

export type CountedLocation = Location & { count: number };

// Distinct shoot locations across a roll's photos, using each photo's override
// or the roll's primary location. De-duplicated by name (case-insensitive).
export function effectiveLocations(roll: RollLike): CountedLocation[] {
  const map = new Map<string, CountedLocation>();
  for (const photo of roll.data.photos) {
    const loc = photo.location ?? roll.data.location;
    const key = loc.name.toLowerCase();
    const existing = map.get(key);
    if (existing) existing.count += 1;
    else map.set(key, { name: loc.name, lat: loc.lat, lng: loc.lng, count: 1 });
  }
  return [...map.values()];
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test src/data/locations.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/data/locations.ts src/data/locations.test.mjs
git commit -m "Add effectiveLocations helper for per-photo map pins"
```

---

## Task 4: `parseFolderName` + `slugify`/`deriveSlug`

**Files:**
- Create: `scripts/admin/lib.mjs`
- Test: `scripts/admin/lib.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/admin/lib.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFolderName, slugify, deriveSlug } from './lib.mjs';

const stocks = { 'kodak-portra-400': {}, 'rollei-rpx-400': {} };

test('parseFolderName: full happy path with multi-token stock + ISO', () => {
  assert.deepEqual(parseFolderName('2026-06-02 - kodak-portra-400-PT', stocks), {
    date: '2026-06-02', stockSlug: 'kodak-portra-400', iso: 'PT', country: 'Portugal',
  });
});

test('parseFolderName: unknown stock leaves stockSlug null but keeps iso/country', () => {
  const r = parseFolderName('2026-06-02 - mystery-stock-JP', stocks);
  assert.equal(r.stockSlug, null);
  assert.equal(r.iso, 'JP');
  assert.equal(r.country, 'Japan');
});

test('parseFolderName: garbled name yields all nulls, never throws', () => {
  assert.deepEqual(parseFolderName('random folder', stocks), {
    date: null, stockSlug: null, iso: null, country: null,
  });
});

test('slugify normalises to kebab', () => {
  assert.equal(slugify('Hong Kong'), 'hong-kong');
  assert.equal(slugify("Côte d'Ivoire"), 'cote-d-ivoire');
});

test('deriveSlug builds YYYY-MM-stock-place', () => {
  assert.equal(
    deriveSlug({ date: '2026-06-02', stockSlug: 'kodak-portra-400', placeName: 'Lisbon, Portugal' }),
    '2026-06-kodak-portra-400-lisbon',
  );
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/admin/lib.test.mjs`
Expected: FAIL — cannot find module `./lib.mjs`.

- [ ] **Step 3: Implement the functions in `scripts/admin/lib.mjs`**

Create `scripts/admin/lib.mjs`:

```js
// Pure helpers for the roll-import admin. No I/O, no Astro imports.

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
      const name = new Intl.DisplayNames(['en'], { type: 'region' }).of(iso);
      result.country = name && name !== iso ? name : null;
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/admin/lib.test.mjs`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/admin/lib.mjs scripts/admin/lib.test.mjs
git commit -m "Add parseFolderName, slugify, deriveSlug admin helpers"
```

---

## Task 5: `buildRollMarkdown` / `parseRollMarkdown`

**Files:**
- Modify: `scripts/admin/lib.mjs`
- Modify: `scripts/admin/lib.test.mjs`

- [ ] **Step 1: Add the failing round-trip test**

Append to `scripts/admin/lib.test.mjs`:

```js
import { buildRollMarkdown, parseRollMarkdown } from './lib.mjs';

const roll = {
  title: 'lisbon in june',
  stock: 'kodak-portra-400',
  date: '2026-06-02',
  location: { name: 'Lisbon, Portugal', lat: 38.7223, lng: -9.1393 },
  draft: false,
  body: 'shot on a borrowed camera.',
  photos: [
    { src: '../../assets/photos/r/001.jpg', alt: 'tram 28' },
    { src: '../../assets/photos/r/002.jpg', alt: 'alfama', caption: 'dusk' },
    {
      src: '../../assets/photos/r/003.jpg',
      alt: 'border',
      location: { name: 'Badajoz, Spain', lat: 38.8794, lng: -6.9707 },
    },
  ],
};

test('buildRollMarkdown omits per-photo location equal to roll default', () => {
  const md = buildRollMarkdown({
    ...roll,
    photos: [{ src: 'x', alt: 'a', location: { ...roll.location } }],
  });
  const { data } = parseRollMarkdown(md);
  assert.equal(data.photos[0].location, undefined);
});

test('buildRollMarkdown ↔ parseRollMarkdown round-trips overrides and body', () => {
  const md = buildRollMarkdown(roll);
  const { data, body } = parseRollMarkdown(md);
  assert.equal(data.title, 'lisbon in june');
  assert.equal(data.stock, 'kodak-portra-400');
  assert.deepEqual(data.location, roll.location);
  assert.equal(data.photos.length, 3);
  assert.equal(data.photos[0].location, undefined);
  assert.equal(data.photos[1].caption, 'dusk');
  assert.deepEqual(data.photos[2].location, roll.photos[2].location);
  assert.equal(body, 'shot on a borrowed camera.');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/admin/lib.test.mjs`
Expected: FAIL — `buildRollMarkdown`/`parseRollMarkdown` are not exported.

- [ ] **Step 3: Implement the functions**

Add to the top of `scripts/admin/lib.mjs` (imports) and bottom (functions):

```js
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
```

```js
function sameLocation(a, b) {
  return a && b && a.name === b.name && a.lat === b.lat && a.lng === b.lng;
}

export function buildRollMarkdown({ title, stock, date, location, draft, photos, body = '' }) {
  const fm = {
    title,
    stock,
    date,
    location: { name: location.name, lat: location.lat, lng: location.lng },
  };
  if (draft) fm.draft = true;
  fm.photos = photos.map((p) => {
    const o = { src: p.src, alt: p.alt };
    if (p.caption) o.caption = p.caption;
    if (p.location && !sameLocation(p.location, location)) {
      o.location = { name: p.location.name, lat: p.location.lat, lng: p.location.lng };
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
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/admin/lib.test.mjs`
Expected: PASS (7 tests total).

- [ ] **Step 5: Commit**

```bash
git add scripts/admin/lib.mjs scripts/admin/lib.test.mjs
git commit -m "Add roll markdown build/parse round-trip helpers"
```

---

## Task 6: `writeRollFiles` (frame processing + temp-dir swap)

**Files:**
- Create: `scripts/admin/publish.mjs`
- Test: `scripts/admin/publish.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/admin/publish.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import sharp from 'sharp';
import { writeRollFiles } from './publish.mjs';
import { parseRollMarkdown } from './lib.mjs';

async function makeImage(path, color) {
  await sharp({ create: { width: 100, height: 100, channels: 3, background: color } })
    .jpeg().toFile(path);
}

test('writeRollFiles processes new frames, numbers them, writes .md', async () => {
  const root = await mkdtemp(join(tmpdir(), 'roll-'));
  const srcDir = join(root, 'scans');
  await mkdir(srcDir, { recursive: true });
  await mkdir(join(root, 'src/content/photos'), { recursive: true });
  await makeImage(join(srcDir, 'a.jpg'), '#ff0000');
  await makeImage(join(srcDir, 'b.jpg'), '#00ff00');

  const meta = {
    title: 't', stock: 'kodak-portra-400', date: '2026-06-02',
    location: { name: 'Lisbon, Portugal', lat: 38.7, lng: -9.1 }, draft: true,
  };
  const res = await writeRollFiles({
    repoRoot: root,
    slug: '2026-06-test',
    meta,
    body: '',
    frames: [
      { srcPath: join(srcDir, 'b.jpg'), alt: 'second' },
      { srcPath: join(srcDir, 'a.jpg'), alt: 'first' },
    ],
  });

  assert.equal(res.frameCount, 2);
  const files = (await readdir(join(root, 'src/assets/photos/2026-06-test'))).sort();
  assert.deepEqual(files, ['001.jpg', '002.jpg']);

  const md = await readFile(join(root, 'src/content/photos/2026-06-test.md'), 'utf8');
  const { data } = parseRollMarkdown(md);
  assert.equal(data.photos[0].alt, 'second');
  assert.equal(data.photos[0].src, '../../assets/photos/2026-06-test/001.jpg');

  await rm(root, { recursive: true, force: true });
});

test('writeRollFiles copies existing frames by number during an edit', async () => {
  const root = await mkdtemp(join(tmpdir(), 'roll-'));
  const photosDir = join(root, 'src/assets/photos/2026-06-edit');
  await mkdir(photosDir, { recursive: true });
  await mkdir(join(root, 'src/content/photos'), { recursive: true });
  await makeImage(join(photosDir, '001.jpg'), '#0000ff');
  const srcDir = join(root, 'scans');
  await mkdir(srcDir, { recursive: true });
  await makeImage(join(srcDir, 'new.jpg'), '#ffff00');

  const meta = {
    title: 't', stock: 'kodak-portra-400', date: '2026-06-02',
    location: { name: 'X', lat: 1, lng: 2 }, draft: true,
  };
  // reorder: new frame first, existing 001 second
  const res = await writeRollFiles({
    repoRoot: root, slug: '2026-06-edit', meta, body: '',
    frames: [
      { srcPath: join(srcDir, 'new.jpg'), alt: 'new' },
      { existing: 1, alt: 'kept' },
    ],
  });
  assert.equal(res.frameCount, 2);
  const files = (await readdir(photosDir)).sort();
  assert.deepEqual(files, ['001.jpg', '002.jpg']);

  await rm(root, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test scripts/admin/publish.test.mjs`
Expected: FAIL — cannot find module `./publish.mjs`.

- [ ] **Step 3: Implement `scripts/admin/publish.mjs`**

Create `scripts/admin/publish.mjs`:

```js
// File + git side of the admin. Pure-ish: writeRollFiles takes an explicit
// repoRoot so it is testable against a temp directory.
import sharp from 'sharp';
import { mkdir, rm, rename, copyFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { buildRollMarkdown } from './lib.mjs';

const exec = promisify(execFile);
const MAX_EDGE = 2048;

// frames: [{ srcPath? , existing?: number, alt, caption?, location? }]
// New frames (srcPath) are sharp-processed; existing frames (number) are copied
// losslessly from the current roll dir. Everything is built in a temp dir and
// swapped in, so reorder/add/remove can't collide.
export async function writeRollFiles({ repoRoot, slug, meta, frames, body = '' }) {
  if (!/^[a-z0-9-]+$/.test(slug)) throw new Error(`invalid slug: ${slug}`);

  const photosDir = join(repoRoot, 'src/assets/photos', slug);
  const tmpDir = join(repoRoot, 'src/assets/photos', `.tmp-${slug}`);
  const contentDir = join(repoRoot, 'src/content/photos');
  const contentFile = join(contentDir, `${slug}.md`);

  await rm(tmpDir, { recursive: true, force: true });
  await mkdir(tmpDir, { recursive: true });

  const outPhotos = [];
  let n = 0;
  for (const f of frames) {
    n += 1;
    const outName = `${String(n).padStart(3, '0')}.jpg`;
    const outPath = join(tmpDir, outName);
    if (f.srcPath) {
      await sharp(f.srcPath)
        .rotate()
        .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(outPath);
    } else if (f.existing != null) {
      await copyFile(join(photosDir, `${String(f.existing).padStart(3, '0')}.jpg`), outPath);
    } else {
      throw new Error('frame has neither srcPath nor existing');
    }
    outPhotos.push({
      src: `../../assets/photos/${slug}/${outName}`,
      alt: f.alt,
      caption: f.caption,
      location: f.location,
    });
  }

  const md = buildRollMarkdown({ ...meta, photos: outPhotos, body });

  await rm(photosDir, { recursive: true, force: true });
  await rename(tmpDir, photosDir);
  await mkdir(contentDir, { recursive: true });
  await writeFile(contentFile, md, 'utf8');

  return {
    frameCount: n,
    photosDir: `src/assets/photos/${slug}`,
    contentFile: `src/content/photos/${slug}.md`,
  };
}

export async function gitPublish({ repoRoot, paths, message }) {
  const log = [];
  const run = async (args) => {
    const { stdout, stderr } = await exec('git', args, { cwd: repoRoot });
    log.push(`$ git ${args.join(' ')}`.trim());
    if (stdout.trim()) log.push(stdout.trim());
    if (stderr.trim()) log.push(stderr.trim());
  };
  await run(['add', ...paths]);
  await run(['commit', '-m', message]);
  await run(['push']);
  return log;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test scripts/admin/publish.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the whole suite**

Run: `npm test`
Expected: PASS — all tests across lib, publish, locations (12 total).

- [ ] **Step 6: Commit**

```bash
git add scripts/admin/publish.mjs scripts/admin/publish.test.mjs
git commit -m "Add writeRollFiles (temp-dir frame rebuild) and gitPublish"
```

---

## Task 7: Admin server skeleton (static serving, localhost only)

**Files:**
- Create: `scripts/admin/server.mjs`

- [ ] **Step 1: Implement the server with static serving + `/api/config`**

Create `scripts/admin/server.mjs`:

```js
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
```

- [ ] **Step 2: Create a placeholder `index.html` so `/` serves**

Create `scripts/admin/index.html` with a minimal stub (replaced in Task 11):

```html
<!doctype html>
<html><head><meta charset="utf-8"><title>roll admin</title></head>
<body><p>admin booting…</p></body></html>
```

- [ ] **Step 3: Start the server and verify endpoints**

Run: `npm run admin &` then:
```bash
sleep 2
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4322/
curl -s http://127.0.0.1:4322/api/config | head -c 120
curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:4322/global.css
kill %1
```
Expected: `200` for `/`; JSON beginning `{"stocks":[` listing all 16 film stocks; `200` for `/global.css`.

- [ ] **Step 4: Commit**

```bash
git add scripts/admin/server.mjs scripts/admin/index.html
git commit -m "Add admin server skeleton with static serving and /api/config"
```

---

## Task 8: `/api/scan` — folder scan + thumbnails + folder-name derivation

**Files:**
- Modify: `scripts/admin/server.mjs`

- [ ] **Step 1: Add imports and the scan route**

Add to the imports at the top of `scripts/admin/server.mjs`:

```js
import { readdir } from 'node:fs/promises';
import sharp from 'sharp';
import { basename } from 'node:path';
import { parseFolderName } from './lib.mjs';
```

Add this route (before `const server =`):

```js
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
```

- [ ] **Step 2: Verify against a fixture folder**

Run:
```bash
mkdir -p /tmp/scan-fixture && node -e "import('sharp').then(async ({default:s})=>{for(const n of ['a','b']) await s({create:{width:80,height:80,channels:3,background:'#888'}}).jpeg().toFile('/tmp/scan-fixture/'+n+'.jpg')})"
npm run admin & sleep 2
curl -s -X POST http://127.0.0.1:4322/api/scan -H 'content-type: application/json' -d '{"folder":"/tmp/scan-fixture"}' | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('frames',j.frames.length,'thumb0',j.frames[0].thumb.slice(0,20))})"
kill %1
```
Expected: `frames 2 thumb0 data:image/jpeg;base64`.

- [ ] **Step 3: Commit**

```bash
git add scripts/admin/server.mjs
git commit -m "Add /api/scan endpoint with thumbnails and folder-name parsing"
```

---

## Task 9: `/api/geocode` — Nominatim proxy

**Files:**
- Modify: `scripts/admin/server.mjs`

- [ ] **Step 1: Add the geocode route**

Add (before `const server =`):

```js
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
```

- [ ] **Step 2: Verify (requires network; skip if offline)**

Run:
```bash
npm run admin & sleep 2
curl -s -X POST http://127.0.0.1:4322/api/geocode -H 'content-type: application/json' -d '{"query":"Lisbon, Portugal"}' | head -c 120
kill %1
```
Expected: a JSON array whose first entry has `name`, numeric `lat` ≈ 38.7, `lng` ≈ -9.1. If offline, expect a `502` error JSON (the UI falls back to manual lat/lng).

- [ ] **Step 3: Commit**

```bash
git add scripts/admin/server.mjs
git commit -m "Add /api/geocode Nominatim proxy"
```

---

## Task 10: `/api/rolls` and `/api/roll/:slug`

**Files:**
- Modify: `scripts/admin/server.mjs`

- [ ] **Step 1: Add imports and routes**

Add to imports:

```js
import { readFile } from 'node:fs/promises'; // already imported in Task 7 — keep one copy
import { parseRollMarkdown } from './lib.mjs'; // extend the Task 8 import line
```

(If `readFile`/`parseFolderName` are already imported, just add `parseRollMarkdown` to the existing `./lib.mjs` import and `readdir` is already present.)

Add these routes (before `const server =`):

```js
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
```

- [ ] **Step 2: Verify against the existing sample roll**

Run:
```bash
npm run admin & sleep 2
curl -s http://127.0.0.1:4322/api/rolls | head -c 200
echo
curl -s http://127.0.0.1:4322/api/roll/2026-05-portra-400-tokyo | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const j=JSON.parse(s);console.log('frames',j.frames.length,'title',j.meta.title)})"
kill %1
```
Expected: rolls array containing `2026-05-portra-400-tokyo`; roll detail with `frames 8` and `title tokyo test roll`.

- [ ] **Step 3: Commit**

```bash
git add scripts/admin/server.mjs
git commit -m "Add /api/rolls and /api/roll/:slug for edit mode"
```

---

## Task 11: `/api/publish` + full admin UI

**Files:**
- Modify: `scripts/admin/server.mjs`
- Modify: `scripts/admin/index.html` (replace stub with full UI)

- [ ] **Step 1: Add the publish route to the server**

Add to imports:

```js
import { writeRollFiles, gitPublish } from './publish.mjs';
import { filmStocks as stocksForName } from '../../src/data/film-stocks.ts'; // reuse existing filmStocks import; do not duplicate
```

(`filmStocks` is already imported in Task 7 — use it directly; the line above is only illustrative. Do not add a duplicate import.)

Add this route (before `const server =`):

```js
route('POST', /^\/api\/publish$/, async (req, res) => {
  const body = await readBody(req);
  const { slug, title, stock, date, location, draft, frames, commit, bodyText = '' } = body;

  // validation
  const errors = [];
  if (!/^[a-z0-9-]+$/.test(slug || '')) errors.push('slug must match [a-z0-9-]');
  if (!(stock in filmStocks)) errors.push(`unknown stock: ${stock}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date || '')) errors.push('date must be YYYY-MM-DD');
  if (!location || !location.name || !Number.isFinite(location.lat) || !Number.isFinite(location.lng)) {
    errors.push('roll location needs name + numeric lat/lng');
  }
  if (!Array.isArray(frames) || frames.length === 0) errors.push('at least one frame required');
  (frames || []).forEach((f, i) => {
    if (!f.alt || !f.alt.trim()) errors.push(`frame ${i + 1} needs alt text`);
    if (f.location && (!f.location.name || !Number.isFinite(f.location.lat) || !Number.isFinite(f.location.lng))) {
      errors.push(`frame ${i + 1} location invalid`);
    }
  });
  if (errors.length) return send(res, 400, { error: errors.join('; ') });

  const log = [];
  const written = await writeRollFiles({
    repoRoot, slug, body: bodyText,
    meta: { title, stock, date, location, draft },
    frames,
  });
  log.push(`wrote ${written.frameCount} frames → ${written.photosDir}`);
  log.push(`wrote ${written.contentFile}`);

  let committed = false;
  if (commit) {
    const message = `${body.mode === 'edit' ? 'Update' : 'Add'} ${title} roll (${filmStocks[stock].name})`;
    const gitLog = await gitPublish({
      repoRoot,
      paths: [written.photosDir, written.contentFile],
      message,
    });
    log.push(...gitLog);
    committed = true;
  }
  send(res, 200, { ok: true, committed, log });
});
```

- [ ] **Step 2: Replace `scripts/admin/index.html` with the full UI**

Overwrite `scripts/admin/index.html`:

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>roll admin</title>
  <link rel="stylesheet" href="/global.css" />
  <style>
    body { padding: 2rem; max-width: 1000px; margin: 0 auto; }
    h1 { font-size: var(--font-size-2xl); margin-bottom: 1rem; }
    fieldset { border: 1px solid var(--color-border); padding: 1rem; margin-bottom: 1rem; }
    legend { color: var(--color-text-muted); padding: 0 .5rem; }
    label { display: block; font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: .5rem 0 .15rem; }
    input, select, textarea, button {
      font-family: inherit; font-size: var(--font-size-sm);
      background: var(--color-bg-secondary); color: var(--color-text-primary);
      border: 1px solid var(--color-border); padding: .4rem .5rem;
    }
    input, textarea, select { width: 100%; }
    button { cursor: pointer; width: auto; }
    button.primary { border-color: var(--color-accent-primary); color: var(--color-accent-primary); }
    .row { display: flex; gap: .5rem; }
    .row > * { flex: 1; }
    .frames { display: flex; flex-wrap: wrap; gap: .5rem; }
    .frame {
      width: 150px; border: 1px solid var(--color-border); background: var(--color-bg-secondary);
      padding: .35rem; cursor: grab;
    }
    .frame.dragover { border-color: var(--color-accent-primary); }
    .frame img { width: 100%; aspect-ratio: 3/2; object-fit: cover; display: block; }
    .frame .n { color: var(--color-accent-secondary); font-size: var(--font-size-xs); }
    .frame .loc { color: var(--color-text-muted); font-size: var(--font-size-xs);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .frame input { font-size: var(--font-size-xs); padding: .2rem; margin-top: .2rem; }
    .geo-results { list-style: none; padding: 0; margin: .25rem 0; }
    .geo-results li { padding: .3rem; border: 1px solid var(--color-border); cursor: pointer; font-size: var(--font-size-xs); }
    .geo-results li:hover { border-color: var(--color-accent-primary); }
    #log { white-space: pre-wrap; font-size: var(--font-size-xs); color: var(--color-text-secondary);
      border: 1px solid var(--color-border); padding: .75rem; min-height: 3rem; }
    .muted { color: var(--color-text-muted); font-size: var(--font-size-xs); }
  </style>
</head>
<body>
  <h1>~/beek/roll-admin</h1>

  <fieldset>
    <legend>mode</legend>
    <div class="row">
      <div>
        <label>edit existing roll</label>
        <select id="roll-picker"><option value="">— new roll —</option></select>
      </div>
      <div>
        <label>source folder (new frames)</label>
        <input id="folder" placeholder="/home/beek/scans/2026-06-02 - kodak-portra-400-PT" />
      </div>
      <div style="flex:0 0 auto; align-self:end;">
        <button id="scan">scan / add frames</button>
      </div>
    </div>
  </fieldset>

  <fieldset>
    <legend>frames — drag to reorder</legend>
    <div style="margin-bottom:.5rem;">
      <button id="bulk-loc">set location for selected ☑</button>
      <span class="muted">tip: setting one frame's location fills forward to following frames.</span>
    </div>
    <div class="frames" id="frames"></div>
  </fieldset>

  <fieldset>
    <legend>roll metadata</legend>
    <div class="row">
      <div><label>title</label><input id="title" /></div>
      <div><label>stock</label><select id="stock"></select></div>
      <div><label>date</label><input id="date" type="date" /></div>
    </div>
    <label>primary location — search</label>
    <div class="row">
      <input id="loc-search" placeholder="Lisbon, Portugal" />
      <button id="loc-go" style="flex:0 0 auto;">search</button>
    </div>
    <ul class="geo-results" id="loc-results"></ul>
    <div class="row">
      <div><label>location name</label><input id="loc-name" /></div>
      <div><label>lat</label><input id="loc-lat" type="number" step="any" /></div>
      <div><label>lng</label><input id="loc-lng" type="number" step="any" /></div>
    </div>
    <div class="row">
      <div><label>slug</label><input id="slug" /></div>
      <div style="flex:0 0 auto; align-self:end;"><label>draft</label><input id="draft" type="checkbox" style="width:auto;" /></div>
    </div>
    <label>roll notes (markdown body)</label>
    <textarea id="body" rows="3"></textarea>
  </fieldset>

  <fieldset>
    <legend>publish</legend>
    <button id="write">write roll</button>
    <button id="publish" class="primary">write + commit + push</button>
    <div id="log" style="margin-top:.5rem;"></div>
  </fieldset>

  <script src="/app.js" type="module"></script>
</body>
</html>
```

- [ ] **Step 3: Add a `/app.js` route to the server**

Add this route to `scripts/admin/server.mjs` (before `const server =`):

```js
route('GET', /^\/app\.js$/, async (req, res) => {
  send(res, 200, await readFile(join(__dirname, 'app.js')), 'text/javascript');
});
```

- [ ] **Step 4: Create `scripts/admin/app.js` (UI logic)**

Create `scripts/admin/app.js`:

```js
const $ = (id) => document.getElementById(id);
const api = async (path, body) => {
  const opts = body ? { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) } : {};
  const r = await fetch(path, opts);
  const data = await r.json();
  if (!r.ok) throw new Error(data.error || r.statusText);
  return data;
};

let frames = [];      // { srcPath?|existing, thumb, alt, caption, location|null, explicit }
let mode = 'create';  // 'create' | 'edit'
let stocks = [];

function log(msg) { $('log').textContent += msg + '\n'; }
function clearLog() { $('log').textContent = ''; }

// ---- init: stocks + roll picker ----
(async () => {
  ({ stocks } = await api('/api/config'));
  $('stock').innerHTML = stocks.map((s) => `<option value="${s.slug}">${s.name}</option>`).join('');
  const rolls = await api('/api/rolls');
  $('roll-picker').innerHTML = '<option value="">— new roll —</option>' +
    rolls.map((r) => `<option value="${r.slug}">${r.slug} (${r.frameCount}f${r.draft ? ', draft' : ''})</option>`).join('');
  $('date').value = new Date().toISOString().slice(0, 10);
})();

// ---- effective location label ----
function rollLoc() {
  const name = $('loc-name').value.trim();
  const lat = parseFloat($('loc-lat').value), lng = parseFloat($('loc-lng').value);
  return name && Number.isFinite(lat) && Number.isFinite(lng) ? { name, lat, lng } : null;
}
function frameLocName(f) { return (f.location || rollLoc() || {}).name || '(set roll location)'; }

// ---- render frames ----
function render() {
  const grid = $('frames');
  grid.innerHTML = '';
  frames.forEach((f, i) => {
    const el = document.createElement('div');
    el.className = 'frame';
    el.draggable = true;
    el.dataset.i = i;
    el.innerHTML = `
      <div class="n">#${String(i + 1).padStart(3, '0')} <input type="checkbox" class="sel" style="width:auto;"></div>
      <img src="${f.thumb}" alt="">
      <input class="alt" placeholder="alt" value="${(f.alt || '').replace(/"/g, '&quot;')}">
      <input class="cap" placeholder="caption (optional)" value="${(f.caption || '').replace(/"/g, '&quot;')}">
      <div class="loc">📍 ${frameLocName(f)}</div>
      <button class="setloc">set location</button>
      <button class="del">remove</button>`;
    el.querySelector('.alt').oninput = (e) => { f.alt = e.target.value; };
    el.querySelector('.cap').oninput = (e) => { f.caption = e.target.value; };
    el.querySelector('.del').onclick = () => { frames.splice(i, 1); render(); };
    el.querySelector('.setloc').onclick = () => setFrameLocation(i);
    el.addEventListener('dragstart', (e) => e.dataTransfer.setData('text/plain', i));
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('dragover'); });
    el.addEventListener('dragleave', () => el.classList.remove('dragover'));
    el.addEventListener('drop', (e) => {
      e.preventDefault(); el.classList.remove('dragover');
      const from = +e.dataTransfer.getData('text/plain');
      const [moved] = frames.splice(from, 1);
      frames.splice(i, 0, moved);
      render();
    });
    grid.appendChild(el);
  });
}

// ---- per-photo location: set + fill-forward ----
async function setFrameLocation(i) {
  const q = prompt('location for this frame (place name):', frameLocName(frames[i]));
  if (!q) return;
  const loc = await pickLocation(q);
  if (!loc) return;
  frames[i].location = loc;
  frames[i].explicit = true;
  for (let j = i + 1; j < frames.length && !frames[j].explicit; j++) frames[j].location = loc;
  render();
}

async function pickLocation(q) {
  try {
    const results = await api('/api/geocode', { query: q });
    if (!results.length) { alert('no results; enter lat/lng manually'); return null; }
    const idx = results.length === 1 ? 0 :
      parseInt(prompt(results.map((r, n) => `${n}: ${r.name}`).join('\n') + '\n\npick #:', '0'), 10);
    return results[idx] || null;
  } catch (e) { alert('geocode failed: ' + e.message); return null; }
}

// ---- bulk set selected ----
$('bulk-loc').onclick = async () => {
  const selected = [...document.querySelectorAll('.frame')].filter((el) => el.querySelector('.sel').checked).map((el) => +el.dataset.i);
  if (!selected.length) return alert('select frames first');
  const loc = await pickLocation(prompt('location for selected frames:') || '');
  if (!loc) return;
  selected.forEach((i) => { frames[i].location = loc; frames[i].explicit = true; });
  render();
};

// ---- scan / add frames ----
$('scan').onclick = async () => {
  clearLog();
  try {
    const { parsed, frames: scanned } = await api('/api/scan', { folder: $('folder').value.trim() });
    const start = frames.length;
    scanned.forEach((f, k) => frames.push({
      srcPath: f.srcPath, thumb: f.thumb,
      alt: `${($('loc-name').value || parsed.country || 'frame')} — frame ${start + k + 1}`,
      caption: '', location: null, explicit: false,
    }));
    if (parsed.date) $('date').value = parsed.date;
    if (parsed.stockSlug) $('stock').value = parsed.stockSlug;
    if (parsed.country && !$('loc-search').value) $('loc-search').value = parsed.country;
    refreshSlug();
    render();
    log(`added ${scanned.length} frames`);
  } catch (e) { log('scan error: ' + e.message); }
};

// ---- geocode roll primary location ----
$('loc-go').onclick = async () => {
  const results = await api('/api/geocode', { query: $('loc-search').value });
  $('loc-results').innerHTML = results.map((r, i) =>
    `<li data-i="${i}">${r.name} <span class="muted">(${r.lat.toFixed(3)}, ${r.lng.toFixed(3)})</span></li>`).join('');
  [...$('loc-results').children].forEach((li, i) => {
    li.onclick = () => {
      const r = results[i];
      $('loc-name').value = r.name; $('loc-lat').value = r.lat; $('loc-lng').value = r.lng;
      $('loc-results').innerHTML = '';
      refreshSlug(); render();
    };
  });
};

function refreshSlug() {
  if (mode === 'edit') return; // keep existing slug when editing
  const date = $('date').value, stock = $('stock').value;
  const place = ($('loc-name').value || '').split(',')[0];
  const ym = date.slice(0, 7);
  const slugPlace = place.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  $('slug').value = [ym, stock, slugPlace].filter(Boolean).join('-');
}
$('date').onchange = refreshSlug;
$('stock').onchange = refreshSlug;

// ---- edit mode: load a roll ----
$('roll-picker').onchange = async (e) => {
  const slug = e.target.value;
  if (!slug) { mode = 'create'; frames = []; render(); return; }
  mode = 'edit';
  const roll = await api('/api/roll/' + slug);
  $('title').value = roll.meta.title;
  $('stock').value = roll.meta.stock;
  $('date').value = roll.meta.date;
  $('loc-name').value = roll.meta.location.name;
  $('loc-lat').value = roll.meta.location.lat;
  $('loc-lng').value = roll.meta.location.lng;
  $('slug').value = roll.slug;
  $('draft').checked = roll.meta.draft;
  $('body').value = roll.body;
  frames = roll.frames.map((f) => ({
    existing: f.existing, thumb: f.thumb, alt: f.alt, caption: f.caption,
    location: f.location, explicit: !!f.location,
  }));
  render();
};

// ---- publish ----
function payload(commit) {
  return {
    mode, commit, slug: $('slug').value.trim(),
    title: $('title').value.trim(), stock: $('stock').value, date: $('date').value,
    location: rollLoc(), draft: $('draft').checked, bodyText: $('body').value,
    frames: frames.map((f) => ({
      srcPath: f.srcPath, existing: f.existing,
      alt: f.alt, caption: f.caption || undefined,
      location: f.location || undefined,
    })),
  };
}

async function doPublish(commit) {
  clearLog();
  const p = payload(commit);
  if (commit) {
    const msg = `${mode === 'edit' ? 'Update' : 'Add'} ${p.title} roll (${(stocks.find((s) => s.slug === p.stock) || {}).name})`;
    if (!confirm(`commit + push?\n\n${msg}`)) return;
  }
  try {
    const res = await api('/api/publish', p);
    res.log.forEach(log);
    log(res.committed ? '✓ committed + pushed' : '✓ written (not committed)');
  } catch (e) { log('publish error: ' + e.message); }
}
$('write').onclick = () => doPublish(false);
$('publish').onclick = () => doPublish(true);
```

- [ ] **Step 5: Manual end-to-end verification (create)**

Run: `npm run admin`, open `http://127.0.0.1:4322/`, then:
1. Create a scratch folder with a few JPEGs named like `2026-06-02 - kodak-portra-400-PT`.
2. Paste the path, click **scan / add frames** → thumbnails appear; date/stock pre-filled; location search pre-seeded "Portugal".
3. Drag a thumbnail to reorder → numbers update.
4. Search a place → click a result → name/lat/lng fill; slug becomes `2026-06-kodak-portra-400-…`.
5. Set one frame's location to a different place → that frame and the following ones show the new 📍 label.
6. Click **write roll** → log shows frames + `.md` written. Confirm `src/content/photos/<slug>.md` exists and `npx astro sync` reports no schema error.

Expected: files written; `git status` shows the new roll dir + `.md`. Delete the scratch roll/dir afterward if it was only a test, or keep as needed.

- [ ] **Step 6: Manual verification (edit)**

In the UI, pick the sample roll `2026-05-portra-400-tokyo` from the edit dropdown → frames + metadata load → reorder two frames → set frame 5's location to a different city → **write roll**. Confirm the `.md` now lists `location:` under photo 5 and frame files renumbered.

- [ ] **Step 7: Run the test suite (no regressions)**

Run: `npm test`
Expected: PASS (all prior tests still green).

- [ ] **Step 8: Commit**

```bash
git add scripts/admin/server.mjs scripts/admin/index.html scripts/admin/app.js
git commit -m "Add /api/publish and full roll-admin UI (create + edit)"
```

---

## Task 12: Map pins from per-photo effective locations

**Files:**
- Modify: `src/pages/photos/index.astro` (the pin-building block in the frontmatter)

- [ ] **Step 1: Replace the pin aggregation with `effectiveLocations`**

In `src/pages/photos/index.astro`, replace the existing `pinMap`/`pins` block (the loop that builds one pin per roll location) with:

```ts
import { effectiveLocations } from '../../data/locations';

// one pin per distinct location across all photos; jump to the most recent
// roll that has a photo there (rolls are already sorted date-desc)
const pinMap = new Map<string, { slug: string; name: string; lat: number; lng: number; count: number }>();
for (const roll of sortedRolls) {
  for (const loc of effectiveLocations(roll)) {
    const key = loc.name.toLowerCase();
    const existing = pinMap.get(key);
    if (existing) existing.count += loc.count;
    else pinMap.set(key, { slug: roll.slug, name: loc.name, lat: loc.lat, lng: loc.lng, count: loc.count });
  }
}
const pins = [...pinMap.values()];
```

Keep the existing `import { type Pin } from '../../components/WorldMap.astro'` and the `totalFrames`/`years` lines as they are. Ensure `sortedRolls` remains sorted date-descending before this block so "most recent roll" is correct.

- [ ] **Step 2: Verify build and pin output**

Run: `npm run build`
Expected: "Complete!" with no errors.

Run:
```bash
npm run dev -- --port 4399 &
sleep 8
curl -s http://localhost:4399/photos/ | grep -oE 'class="pin"' | wc -l
kill %1
```
Expected: at least 1 pin (the sample roll is draft — it shows in dev). If you added per-photo overrides during Task 11 testing, expect a pin per distinct location.

- [ ] **Step 3: Commit**

```bash
git add src/pages/photos/index.astro
git commit -m "Build map pins from per-photo effective locations"
```

---

## Task 13: Roll page lightbox shows per-photo effective location

**Files:**
- Modify: `src/pages/photos/[roll].astro`

- [ ] **Step 1: Pass each photo's effective location into the FilmStrip meta**

In `src/pages/photos/[roll].astro`, the strips currently pass a single roll-level `meta` string. Change the data so each photo carries its effective location name, and the lightbox meta uses it.

Find where `strips` are built and the `<FilmStrip>` is rendered. Replace the `meta` derivation so it is computed per photo: ensure each photo object passed to `FilmStrip` includes `locName = photo.location?.name ?? location.name`. Then update `FilmStrip.astro` to use the per-photo location in `data-meta`.

In `[roll].astro`, where photos are chunked into strips, map each photo to include its effective location name:

```ts
const photosWithLoc = photos.map((p) => ({ ...p, locName: p.location?.name ?? location.name }));
const strips: (typeof photosWithLoc)[] = [];
for (let i = 0; i < photosWithLoc.length; i += FRAMES_PER_STRIP) {
  strips.push(photosWithLoc.slice(i, i + FRAMES_PER_STRIP));
}
```

Pass the roll's short date down and drop the single roll-wide location from `meta` (location now comes per photo). Update the `<FilmStrip>` usage to pass `shortDate` instead of the combined `meta`:

```astro
<FilmStrip
  photos={strip}
  stockName={film.name}
  stockType={film.type}
  startFrame={i * FRAMES_PER_STRIP + 1}
  shortDate={shortDate}
/>
```

- [ ] **Step 2: Update `FilmStrip.astro` to build per-photo meta**

In `src/components/FilmStrip.astro`, replace the `meta` prop with `shortDate`, and compute `data-meta` per frame using the photo's `locName`:

Change the props interface and destructure:

```ts
interface Props {
  photos: { src: ImageMetadata; alt: string; caption?: string; locName: string }[];
  stockName: string;
  stockType: 'color' | 'bw';
  startFrame?: number;
  shortDate: string;
}
const { photos, stockName, stockType, startFrame = 1, shortDate } = Astro.props;
```

Change the per-frame `data-meta` to:

```astro
data-meta={`${stockName.toUpperCase()} · ${startFrame + i}A · ${shortDate} · ${photos[i].locName.toUpperCase()}`}
```

(Keep the rest of `FilmStrip.astro` — sprockets, edge markings, `getImage` for `data-full` — unchanged. The `fullImages` mapping over `photos` still works because `locName` is an added field.)

- [ ] **Step 2b: Verify FilmStrip still receives valid image sources**

The `getImage({ src: p.src, width: 2048 })` call in `FilmStrip.astro` uses `p.src`, which is still present on each spread photo object — confirm the spread in `[roll].astro` keeps `src`.

- [ ] **Step 3: Verify build + lightbox meta**

Run: `npm run build`
Expected: "Complete!"

Run:
```bash
npm run dev -- --port 4399 &
sleep 8
curl -s http://localhost:4399/photos/2026-05-portra-400-tokyo/ | grep -oE 'data-meta="[^"]*"' | head -2
kill %1
```
Expected: `data-meta` strings ending in `· TOKYO, JAPAN` (the sample roll's location), one per frame.

- [ ] **Step 4: Commit**

```bash
git add src/pages/photos/[roll].astro src/components/FilmStrip.astro
git commit -m "Show per-photo effective location in contact-sheet lightbox"
```

---

## Task 14: Homepage `rolls/` section + RollRow multi-location suffix

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/components/RollRow.astro`

- [ ] **Step 1: Add the rolls section to the homepage frontmatter**

In `src/pages/index.astro`, add to the frontmatter (after the `recentWork` lines):

```ts
import RollRow from '../components/RollRow.astro';
const allRolls = await getCollection('photos', ({ data }) => !data.draft);
const recentRolls = allRolls.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf()).slice(0, 5);
```

- [ ] **Step 2: Render the section after the `recent/` section**

In `src/pages/index.astro`, after the closing `</section>` of the `recent` block (still inside `.container`), add:

```astro
{recentRolls.length > 0 && (
  <section class="recent" aria-labelledby="rolls-heading">
    <div class="dir-header">
      <h2 id="rolls-heading" class="dir-path">rolls/</h2>
      <a href="/photos" class="dir-link">view all →</a>
    </div>
    <div class="dir-list">
      {recentRolls.map(roll => (
        <RollRow roll={roll} />
      ))}
    </div>
  </section>
)}
```

- [ ] **Step 3: Add `+N` multi-location suffix to RollRow**

In `src/components/RollRow.astro`, add the helper import and compute the suffix in the frontmatter:

```ts
import { effectiveLocations } from '../data/locations';
```

After the existing `const { title, stock, date, location, photos } = roll.data;` line, add:

```ts
const locCount = effectiveLocations(roll).length;
const locLabel = locCount > 1 ? `${location.name} +${locCount - 1}` : location.name;
```

Then change the location cell from `{location.name}` to `{locLabel}`:

```astro
<span class="row-location">{locLabel}</span>
```

- [ ] **Step 4: Verify build + homepage**

Run: `npm run build`
Expected: "Complete!" — note the homepage won't show rolls in the *production* build because the only roll is draft. That's expected.

Run:
```bash
npm run dev -- --port 4399 &
sleep 8
curl -s http://localhost:4399/ | grep -oE 'rolls/|roll-[a-z0-9-]+' | head
kill %1
```
Expected: `rolls/` heading present and a `roll-2026-05-portra-400-tokyo` row (draft shows in dev).

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro src/components/RollRow.astro
git commit -m "Add homepage rolls/ section and multi-location row label"
```

---

## Task 15: Cleanup — remove superseded import script, update README

**Files:**
- Delete: `scripts/import-roll.mjs`
- Modify: `README.md` (the "Adding a Roll of Film" section + Commands table)

- [ ] **Step 1: Remove the old script**

Run: `git rm scripts/import-roll.mjs`

- [ ] **Step 2: Replace the README "Adding a Roll of Film" section**

In `README.md`, replace the entire "### Adding a Roll of Film" section (down to, but not including, the "### Images" section) with:

```markdown
### Adding or Editing a Roll of Film

Photography lives at `/photos` as one page per developed roll, rendered as a
contact sheet. Rolls are managed through a local, dev-only admin app — it never
deploys (it is not part of the Astro build).

```sh
npm run admin   # opens http://127.0.0.1:4322
```

**Create a roll:**

1. Name your scans folder `YYYY-MM-DD - <film-stock-slug>-<ISO>` (e.g.
   `2026-06-02 - kodak-portra-400-PT`). The admin derives the date, film stock,
   and country from it; anything that doesn't match is left for manual entry.
2. Paste the folder path and **scan** — thumbnails appear.
3. **Drag** thumbnails to set frame order; edit each frame's alt/caption.
4. Search the **primary location** to fill lat/lng (or type them).
5. **Per-photo location:** if a roll spans places (e.g. China then Hong Kong),
   set a frame's location — it fills forward to following frames until the next
   change; or multi-select frames and bulk-assign. Each location becomes its own
   map pin.
6. **Write + commit + push** to publish (Netlify deploys on push), or **write
   roll** to only write files and commit yourself.

**Edit a roll:** pick it from the edit dropdown — frames and metadata load;
reorder, relabel, add frames (scan another folder), remove frames, or change
locations, then publish again.

**New film stock?** Add it to `src/data/film-stocks.ts` first (its `type`,
`color` or `bw`, sets the contact-sheet edge-marking colour).
```

- [ ] **Step 3: Update the Commands table**

In `README.md`, in the Commands table, remove the `import-roll.mjs` row and add:

```markdown
| `npm run admin` | Local roll-import admin at `127.0.0.1:4322` (create/edit rolls) |
| `npm test` | Run the unit test suite |
```

- [ ] **Step 4: Verify no remaining references to the old script**

Run: `grep -rn "import-roll" README.md scripts/ 2>/dev/null`
Expected: no output (all references removed).

- [ ] **Step 5: Commit**

```bash
git add README.md scripts/
git commit -m "Replace import-roll.mjs with admin app in docs"
```

---

## Task 16: Final verification

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: PASS — locations (3), lib (7), publish (2) = 12 tests, 0 failures.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: "Complete!" with no errors; draft sample roll absent from `dist/`.

- [ ] **Step 3: Admin smoke (server boots, config + rolls respond)**

Run:
```bash
npm run admin & sleep 2
curl -s -o /dev/null -w "config %{http_code}\n" http://127.0.0.1:4322/api/config
curl -s -o /dev/null -w "rolls %{http_code}\n" http://127.0.0.1:4322/api/rolls
curl -s -o /dev/null -w "ui %{http_code}\n" http://127.0.0.1:4322/
kill %1
```
Expected: `config 200`, `rolls 200`, `ui 200`.

- [ ] **Step 4: Confirm the admin server is not in the production build**

Run: `grep -rl "createServer\|gitPublish" dist/ 2>/dev/null | head`
Expected: no output — the admin code never reaches `dist/`.

- [ ] **Step 5: Push**

```bash
git push origin main
```
Expected: pushes the feature commits; Netlify builds.

---

## Self-Review notes

- **Spec coverage:** dev-only standalone server (Tasks 7–11), folder-name
  derivation (Task 4 + scan in Task 8), place-search geocode (Task 9 + UI Task
  11), per-photo location schema (Task 2), `effectiveLocations` (Task 3), map
  aggregation (Task 12), roll lightbox per-photo location (Task 13), homepage
  `rolls/` + `+N` (Task 14), write+commit+push (Task 11), edit mode (Tasks 10 +
  11), cleanup (Task 15), tests (Tasks 3–6, 16). All spec sections mapped.
- **Type consistency:** frame shape `{ srcPath?|existing, alt, caption?, location? }`
  is identical across `writeRollFiles` (Task 6), `/api/publish` (Task 11), and
  the UI payload (Task 11). `effectiveLocations` signature matches between
  Task 3, Task 12, and Task 14. `FilmStrip` prop rename `meta`→`shortDate` is
  applied in both the component and its caller (Task 13).
- **Note for executor:** several tasks add imports to `scripts/admin/server.mjs`
  incrementally — before adding an import line, check it isn't already present
  from an earlier task (especially `readFile`, `readdir`, `join`, `filmStocks`).
