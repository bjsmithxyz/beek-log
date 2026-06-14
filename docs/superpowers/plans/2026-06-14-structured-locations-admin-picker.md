# Structured Locations + Admin Location Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a primary/secondary (place + optional region) location model so the site map shows one pin per country with a city breakdown, and replace the admin's `prompt()` location flow with one shared Leaflet-based picker.

**Architecture:** A `region` field is added to the location schema (backward compatible). The site map aggregates pins by region via a pure `aggregatePins` helper and renders a two-line tooltip. The admin gets a single `openLocationPicker` overlay (search + Leaflet map + reusable chips), backed by a new pure `loc-utils.mjs`, with the geocode endpoint auto-deriving the country.

**Tech Stack:** Astro 6, Zod, vanilla JS admin (Node http server), Leaflet 1.9 (CDN), Nominatim geocoder, `node --test`.

**Spec:** `docs/superpowers/specs/2026-06-14-structured-locations-admin-picker-design.md`

---

## Task 1: Location schema + types carry `region`

**Files:**
- Modify: `src/content.config.ts`
- Modify: `src/data/locations.ts`
- Test: `src/data/locations.test.mjs`

- [ ] **Step 1: Write the failing test**

Add to `src/data/locations.test.mjs` (after the existing `hk` const and before the first test, add a region fixture; then append the test):

```js
const viet = { name: 'Hoi An', lat: 15.8801, lng: 108.338, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } };

test('region is carried through onto the counted location', () => {
  const roll = { data: { location: viet, photos: [{}, {}] } };
  assert.deepEqual(effectiveLocations(roll), [{ ...viet, count: 2 }]);
});

test('locations without a region gain no region key', () => {
  const roll = { data: { location: cn, photos: [{}] } };
  assert.deepEqual(Object.keys(effectiveLocations(roll)[0]).sort(), ['count', 'lat', 'lng', 'name']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A3 "region is carried"`
Expected: FAIL — `region` is dropped by `effectiveLocations` (result lacks the `region` key).

- [ ] **Step 3: Update the schema**

In `src/content.config.ts`, replace the `locationSchema` definition:

```ts
const pointSchema = z.object({
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const locationSchema = pointSchema.extend({
  region: pointSchema.optional(),
});
```

- [ ] **Step 4: Update the types + carry region**

In `src/data/locations.ts`, replace the `Location` interface and the body of `effectiveLocations`:

```ts
export interface Point {
  name: string;
  lat: number;
  lng: number;
}

export interface Location extends Point {
  region?: Point;
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
    // only attach `region` when present, so region-less locations keep their
    // exact shape (no `region: undefined` key)
    else map.set(key, {
      name: loc.name, lat: loc.lat, lng: loc.lng,
      ...(loc.region ? { region: loc.region } : {}),
      count: 1,
    });
  }
  return [...map.values()];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test 2>&1 | tail -5`
Expected: all pass (existing region-less tests unaffected, two new tests pass).

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/data/locations.ts src/data/locations.test.mjs
git commit -m "Add optional region to the location schema and types"
```

---

## Task 2: Serialize `region` in admin frontmatter

**Files:**
- Modify: `scripts/admin/lib.mjs`
- Test: `scripts/admin/lib.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `scripts/admin/lib.test.mjs`:

```js
test('buildRollMarkdown round-trips a nested region on roll + photo', () => {
  const withRegion = {
    ...roll,
    location: { name: 'Hoi An', lat: 15.8801, lng: 108.338, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } },
    photos: [
      { src: 'x', alt: 'a' },
      { src: 'y', alt: 'b', location: { name: 'Da Nang', lat: 16.054, lng: 108.202, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } } },
    ],
  };
  const { data } = parseRollMarkdown(buildRollMarkdown(withRegion));
  assert.deepEqual(data.location.region, { name: 'Vietnam', lat: 14.06, lng: 108.28 });
  assert.deepEqual(data.photos[1].location.region, { name: 'Vietnam', lat: 14.06, lng: 108.28 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A3 "round-trips a nested region"`
Expected: FAIL — `buildRollMarkdown` strips `region` (it copies only `name/lat/lng`).

- [ ] **Step 3: Implement region serialization**

In `scripts/admin/lib.mjs`, replace `sameLocation` and the location-writing parts of `buildRollMarkdown`:

```js
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
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test 2>&1 | tail -5`
Expected: all pass (existing `buildRollMarkdown` tests still pass — region-less locations serialize as `{name,lat,lng}`).

- [ ] **Step 5: Commit**

```bash
git add scripts/admin/lib.mjs scripts/admin/lib.test.mjs
git commit -m "Serialize nested region in admin roll frontmatter"
```

---

## Task 3: Aggregate pins by region (site map data)

**Files:**
- Modify: `src/data/locations.ts`
- Test: `src/data/locations.test.mjs`

- [ ] **Step 1: Write the failing test**

Append to `src/data/locations.test.mjs`:

```js
import { aggregatePins } from './locations.ts';

const hoiAn = { name: 'Hoi An', lat: 15.8801, lng: 108.338, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } };
const daNang = { name: 'Da Nang', lat: 16.054, lng: 108.202, region: { name: 'Vietnam', lat: 14.06, lng: 108.28 } };

test('aggregatePins groups by region: one pin at the region with a member breakdown', () => {
  const rolls = [{ id: 'r1', data: { location: hoiAn, photos: [{}, { location: daNang }] } }];
  const pins = aggregatePins(rolls);
  assert.equal(pins.length, 1);
  assert.deepEqual(
    { slug: pins[0].slug, label: pins[0].label, lat: pins[0].lat, lng: pins[0].lng, count: pins[0].count },
    { slug: 'r1', label: 'Vietnam', lat: 14.06, lng: 108.28, count: 2 },
  );
  assert.deepEqual(pins[0].members.sort(), ['Da Nang', 'Hoi An']);
});

test('aggregatePins keeps region-less locations standalone with no members', () => {
  const pins = aggregatePins([{ id: 'r2', data: { location: cn, photos: [{}] } }]);
  assert.deepEqual(pins, [{ slug: 'r2', label: 'Shenzhen, China', lat: 22.5, lng: 114.05, count: 1, members: [] }]);
});

test('aggregatePins sums one region across multiple rolls, slug = first (most recent)', () => {
  const rolls = [
    { id: 'newer', data: { location: hoiAn, photos: [{}] } },
    { id: 'older', data: { location: daNang, photos: [{}, {}] } },
  ];
  const pins = aggregatePins(rolls);
  assert.equal(pins.length, 1);
  assert.equal(pins[0].slug, 'newer');
  assert.equal(pins[0].count, 3);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test 2>&1 | grep -A3 "aggregatePins groups by region"`
Expected: FAIL — `aggregatePins` is not exported.

- [ ] **Step 3: Implement `aggregatePins`**

Append to `src/data/locations.ts`:

```ts
export interface Pin {
  slug: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  members: string[];
}

interface PinRoll {
  id: string;
  data: {
    location: Location;
    photos: { location?: Location }[];
  };
}

// One pin per primary: group every roll's effective locations by region name
// (falling back to the place name). The pin sits at the region (or the place if
// none); `members` lists the distinct secondary places for the tooltip.
export function aggregatePins(rolls: PinRoll[]): Pin[] {
  const groups = new Map<string, {
    slug: string; label: string; lat: number; lng: number;
    count: number; places: Map<string, number>;
  }>();
  for (const roll of rolls) {
    for (const loc of effectiveLocations(roll)) {
      const region = loc.region;
      const label = region ? region.name : loc.name;
      const key = label.toLowerCase();
      let g = groups.get(key);
      if (!g) {
        g = {
          slug: roll.id,
          label,
          lat: region ? region.lat : loc.lat,
          lng: region ? region.lng : loc.lng,
          count: 0,
          places: new Map(),
        };
        groups.set(key, g);
      }
      g.count += loc.count;
      g.places.set(loc.name, (g.places.get(loc.name) ?? 0) + loc.count);
    }
  }
  return [...groups.values()].map((g) => ({
    slug: g.slug,
    label: g.label,
    lat: g.lat,
    lng: g.lng,
    count: g.count,
    members: [...g.places.entries()]
      .filter(([name]) => name.toLowerCase() !== g.label.toLowerCase())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name),
  }));
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test 2>&1 | tail -5`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/data/locations.ts src/data/locations.test.mjs
git commit -m "Add aggregatePins: one map pin per region with member breakdown"
```

---

## Task 4: Render grouped pins + two-line tooltip

**Files:**
- Modify: `src/pages/photos/index.astro:14-26`
- Modify: `src/components/WorldMap.astro`

- [ ] **Step 1: Use `aggregatePins` in the photos page**

In `src/pages/photos/index.astro`, replace the import line:

```ts
import { aggregatePins } from '../../data/locations';
```

(The page no longer calls `effectiveLocations` directly — it was only used in the now-removed `pinMap` loop; `RollRow.astro` imports its own copy.)

Then replace the whole pin-building block (the `// one pin per distinct location…` comment through `const pins = [...pinMap.values()];`) with:

```ts
const pins = aggregatePins(sortedRolls);
```

- [ ] **Step 2: Update the `Pin` interface + tooltip in WorldMap**

In `src/components/WorldMap.astro`, replace the `Pin` interface:

```ts
export interface Pin {
  slug: string;
  label: string;
  lat: number;
  lng: number;
  count: number;
  members: string[];
}
```

Replace the `pins.map(...)` block with the two-line version:

```astro
  {pins.map((p) => {
    const { x, y } = project(p.lat, p.lng);
    const line1 = `${p.label} — ${p.count} ${p.count === 1 ? 'frame' : 'frames'}`;
    const line2 = p.members.join(' · ');
    const fontSize = 3.2;
    const subSize = 2.6;
    const width = Math.max(line1.length * fontSize * 0.6, line2.length * subSize * 0.6) + 4;
    const rectH = (line2 ? fontSize + subSize + 1.4 : fontSize) + 3.2;
    const rectX = Math.min(Math.max(x - width / 2, 1), COLS - width - 1);
    const rectY = Math.max(1, y - 3 - rectH);
    const cx = rectX + width / 2;
    return (
      <a href={`#roll-${p.slug}`} class="pin-link" aria-label={line1} data-slug={p.slug}>
        <circle cx={x} cy={y} r="3.4" class="pin-halo" />
        <circle cx={x} cy={y} r="1" class="pin" />
        <g class="tooltip" aria-hidden="true">
          <rect x={rectX} y={rectY} width={width} height={rectH} rx="0.8" class="tooltip-box" />
          <text
            x={cx}
            y={rectY + (line2 ? rectH * 0.36 : rectH / 2)}
            font-size={fontSize}
            text-anchor="middle"
            dominant-baseline="central"
            class="tooltip-text"
          >{line1}</text>
          {line2 && (
            <text
              x={cx}
              y={rectY + rectH * 0.72}
              font-size={subSize}
              text-anchor="middle"
              dominant-baseline="central"
              class="tooltip-sub"
            >{line2}</text>
          )}
        </g>
      </a>
    );
  })}
```

- [ ] **Step 3: Add the sub-line style**

In `src/components/WorldMap.astro`, add to the `<style>` block after `.tooltip-text`:

```css
  .tooltip-sub {
    fill: var(--color-text-muted);
    font-family: monospace;
  }
```

- [ ] **Step 4: Build and eyeball**

Run: `rm -rf .astro && npm run build 2>&1 | tail -3`
Expected: `[build] Complete!`

Run: `grep -c 'class="tooltip-sub"' dist/photos/index.html`
Expected: `0` currently (no roll has a region yet) — confirms region-less rolls still render one pin each with a single-line tooltip. (After Task 8 migration, this becomes non-zero.)

- [ ] **Step 5: Commit**

```bash
git add src/pages/photos/index.astro src/components/WorldMap.astro
git commit -m "Render one map pin per region with a two-line tooltip"
```

---

## Task 5: Pure admin location helpers

**Files:**
- Create: `scripts/admin/loc-utils.mjs`
- Test: `scripts/admin/loc-utils.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `scripts/admin/loc-utils.test.mjs`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dedupeByName, knownLocations, fillForward } from './loc-utils.mjs';

const hoiAn = { name: 'Hoi An', lat: 15.88, lng: 108.33, region: { name: 'Vietnam', lat: 14, lng: 108 } };
const daNang = { name: 'Da Nang', lat: 16.05, lng: 108.2 };

test('dedupeByName keeps first of each name, case-insensitive, in order', () => {
  const out = dedupeByName([hoiAn, { ...daNang }, { ...hoiAn, name: 'hoi an', lat: 0 }]);
  assert.deepEqual(out.map((l) => l.name), ['Hoi An', 'Da Nang']);
  assert.equal(out[0].lat, 15.88);
});

test('knownLocations gathers roll primary + frame locations, deduped, region kept', () => {
  const frames = [{ location: daNang }, { location: { ...hoiAn } }, {}];
  const out = knownLocations(hoiAn, frames);
  assert.deepEqual(out.map((l) => l.name), ['Hoi An', 'Da Nang']);
  assert.deepEqual(out[0].region, { name: 'Vietnam', lat: 14, lng: 108 });
});

test('fillForward sets the frame + following non-explicit frames, stops at explicit', () => {
  const frames = [
    { location: null, explicit: false },
    { location: null, explicit: false },
    { location: { name: 'set' }, explicit: true },
    { location: null, explicit: false },
  ];
  fillForward(frames, 0, daNang);
  assert.equal(frames[0].location, daNang);
  assert.equal(frames[0].explicit, true);
  assert.equal(frames[1].location, daNang);
  assert.equal(frames[2].location.name, 'set'); // unchanged — was explicit
  assert.equal(frames[3].location, null);       // not reached
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test scripts/admin/loc-utils.test.mjs 2>&1 | tail -5`
Expected: FAIL — cannot find module `./loc-utils.mjs`.

- [ ] **Step 3: Implement the helpers**

Create `scripts/admin/loc-utils.mjs`:

```js
// Pure location helpers shared by the admin browser app and its tests.
// No DOM, no I/O — safe to import in both the browser (served at /loc-utils.mjs)
// and node --test.

export function dedupeByName(locations) {
  const seen = new Set();
  const out = [];
  for (const loc of locations) {
    if (!loc || !loc.name) continue;
    const key = loc.name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(loc);
  }
  return out;
}

// The roll's primary plus every frame's explicit location, deduped — these are
// the reuse chips offered in the picker.
export function knownLocations(rollPrimary, frames) {
  const all = [];
  if (rollPrimary) all.push(rollPrimary);
  for (const f of frames) if (f.location) all.push(f.location);
  return dedupeByName(all);
}

// Assign a location to one frame and cascade to following frames that have not
// been explicitly set.
export function fillForward(frames, fromIndex, loc) {
  frames[fromIndex].location = loc;
  frames[fromIndex].explicit = true;
  for (let j = fromIndex + 1; j < frames.length && !frames[j].explicit; j++) {
    frames[j].location = loc;
  }
  return frames;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test scripts/admin/loc-utils.test.mjs 2>&1 | tail -5`
Expected: PASS (3 tests). Also run `npm test 2>&1 | grep -E "pass|fail"` to confirm the suite still green.

- [ ] **Step 5: Commit**

```bash
git add scripts/admin/loc-utils.mjs scripts/admin/loc-utils.test.mjs
git commit -m "Add pure admin location helpers (dedupe, known, fill-forward)"
```

---

## Task 6: Geocode auto-derives region; serve helpers; validate region

**Files:**
- Modify: `scripts/admin/server.mjs`

- [ ] **Step 1: Replace the geocode route with address-detail + region resolution**

In `scripts/admin/server.mjs`, replace the existing `/api/geocode` route (the `route('POST', /^\/api\/geocode$/, …)` block) with:

```js
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
```

- [ ] **Step 2: Serve `loc-utils.mjs` to the browser**

In `scripts/admin/server.mjs`, after the `route('GET', /^\/app\.js$/, …)` route, add:

```js
route('GET', /^\/loc-utils\.mjs$/, async (req, res) => {
  send(res, 200, await readFile(join(__dirname, 'loc-utils.mjs')), 'text/javascript');
});
```

- [ ] **Step 3: Validate region on publish**

In `scripts/admin/server.mjs`, inside the `/api/publish` route, just after the existing roll-location validation block (the `if (!location || !location.name …)` check) add:

```js
  const badRegion = (l) => l && l.region && (!l.region.name || !Number.isFinite(l.region.lat) || !Number.isFinite(l.region.lng));
  if (badRegion(location)) errors.push('roll region invalid');
```

And inside the existing `(frames || []).forEach((f, i) => { … })` loop, after the frame-location check add:

```js
    if (badRegion(f.location)) errors.push(`frame ${i + 1} region invalid`);
```

- [ ] **Step 4: Manual verification**

Run: `npm run admin` (starts on http://127.0.0.1:4322), then in another shell:

```bash
curl -s -XPOST localhost:4322/api/geocode -H 'content-type: application/json' -d '{"query":"Hoi An"}' | head -c 400
```

Expected: JSON array; first result has `name` like `Hội An` (not the long display_name) and a `region` of `{ name: "Vietnam", lat, lng }`.

Run: `curl -s localhost:4322/loc-utils.mjs | head -1`
Expected: the helper source (`// Pure location helpers …`).

Stop the server (Ctrl-C).

- [ ] **Step 5: Commit**

```bash
git add scripts/admin/server.mjs
git commit -m "Geocode auto-derives country region; serve loc-utils; validate region"
```

---

## Task 7: Shared location picker UI in the admin

**Files:**
- Modify: `scripts/admin/index.html`
- Modify: `scripts/admin/app.js`

- [ ] **Step 1: Load Leaflet + add picker markup + styles**

In `scripts/admin/index.html`, inside `<head>` after the `global.css` link, add:

```html
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
```

In the `<style>` block, append:

```css
    .picker-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.6);
      display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .picker-overlay[hidden] { display: none; }
    .picker-panel { width: min(560px, 92vw); max-height: 90vh; overflow: auto;
      background: var(--color-bg-primary); border: 1px solid var(--color-border-strong); padding: 1rem; }
    .picker-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .5rem; }
    .pk-map { height: 260px; margin: .5rem 0; border: 1px solid var(--color-border); }
    .pk-map .leaflet-tile { filter: grayscale(1) brightness(.9); }
    .chips { display: flex; flex-wrap: wrap; gap: .3rem; margin: .25rem 0; }
    .chip { font-size: var(--font-size-xs); padding: .2rem .4rem; cursor: pointer; width: auto; }
```

Replace the roll-metadata location block — the `<label>primary location — search</label>` line through the `<div class="row">…lng…</div>` block (i.e. the search row, `#loc-results`, and the name/lat/lng row) — with:

```html
    <label>primary location</label>
    <div class="row">
      <div id="loc-display" class="muted" style="flex:1; align-self:center;">(none set)</div>
      <button id="loc-edit" type="button" style="flex:0 0 auto;">set location</button>
    </div>
    <input id="loc-name" type="hidden" />
    <input id="loc-lat" type="hidden" />
    <input id="loc-lng" type="hidden" />
```

Before the closing `</body>` (just before the `<script src="/app.js" …>` line), add the picker overlay:

```html
  <div id="picker" class="picker-overlay" hidden>
    <div class="picker-panel">
      <div class="picker-head"><strong>set location</strong><button id="pk-cancel" type="button">✕</button></div>
      <div class="row">
        <input id="pk-search" placeholder="search place…" />
        <button id="pk-go" type="button" style="flex:0 0 auto;">search</button>
      </div>
      <ul class="geo-results" id="pk-results"></ul>
      <div id="pk-chips" class="chips"></div>
      <div id="pk-map" class="pk-map"></div>
      <div class="row">
        <div><label>place</label><input id="pk-name" /></div>
        <div><label>lat</label><input id="pk-lat" type="number" step="any" /></div>
        <div><label>lng</label><input id="pk-lng" type="number" step="any" /></div>
      </div>
      <div class="row"><div><label>region (country)</label><input id="pk-region" /></div></div>
      <div id="pk-msg" class="muted"></div>
      <div class="row" style="justify-content:flex-end;">
        <button id="pk-ok" class="primary" type="button" style="flex:0 0 auto;">use location</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 2: Add the picker module + region-aware roll location to app.js**

At the very top of `scripts/admin/app.js`, add the import:

```js
import { knownLocations, fillForward } from '/loc-utils.mjs';
```

Replace the `rollLoc` and `frameLocName` functions with region-aware versions and a roll-region module variable. Replace:

```js
function rollLoc() {
  const name = $('loc-name').value.trim();
  const lat = parseFloat($('loc-lat').value), lng = parseFloat($('loc-lng').value);
  return name && Number.isFinite(lat) && Number.isFinite(lng) ? { name, lat, lng } : null;
}
function frameLocName(f) { return (f.location || rollLoc() || {}).name || '(set roll location)'; }
```

with:

```js
let rollRegion = null;
function rollLoc() {
  const name = $('loc-name').value.trim();
  const lat = parseFloat($('loc-lat').value), lng = parseFloat($('loc-lng').value);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const loc = { name, lat, lng };
  if (rollRegion) loc.region = rollRegion;
  return loc;
}
function setRollLocation(loc) {
  $('loc-name').value = loc ? loc.name : '';
  $('loc-lat').value = loc ? loc.lat : '';
  $('loc-lng').value = loc ? loc.lng : '';
  rollRegion = (loc && loc.region) || null;
  $('loc-display').textContent = loc ? (loc.name + (loc.region ? ` · ${loc.region.name}` : '')) : '(none set)';
  refreshSlug();
}
function frameLocName(f) { return (f.location || rollLoc() || {}).name || '(set roll location)'; }
```

- [ ] **Step 3: Add the picker implementation to app.js**

Append to `scripts/admin/app.js`:

```js
// ---- shared location picker -------------------------------------------------
let pickerMap = null, pickerMarker = null, pickerResolve = null, pickerRegion = null;

function ensurePickerMap() {
  if (pickerMap || !window.L) return;
  pickerMap = L.map('pk-map').setView([20, 0], 1);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap', maxZoom: 19 }).addTo(pickerMap);
  pickerMarker = L.marker([20, 0], { draggable: true }).addTo(pickerMap);
  pickerMarker.on('dragend', () => {
    const { lat, lng } = pickerMarker.getLatLng();
    $('pk-lat').value = lat.toFixed(4);
    $('pk-lng').value = lng.toFixed(4);
  });
}

function setPickerPin(lat, lng, zoom) {
  if (!pickerMap) return;
  pickerMarker.setLatLng([lat, lng]);
  pickerMap.setView([lat, lng], zoom ?? 8);
}

function fillPickerFields(loc) {
  $('pk-name').value = loc ? loc.name : '';
  $('pk-lat').value = loc ? loc.lat : '';
  $('pk-lng').value = loc ? loc.lng : '';
  $('pk-region').value = (loc && loc.region) ? loc.region.name : '';
  pickerRegion = (loc && loc.region) || null;
  if (loc && window.L) setPickerPin(loc.lat, loc.lng);
}

function renderChips(known) {
  $('pk-chips').innerHTML = known
    .map((l, i) => `<button type="button" class="chip" data-i="${i}">${l.name}${l.region ? ` · ${l.region.name}` : ''}</button>`)
    .join('');
  [...$('pk-chips').children].forEach((btn, i) => { btn.onclick = () => fillPickerFields(known[i]); });
}

async function pkSearch() {
  const q = $('pk-search').value.trim();
  if (!q) return;
  $('pk-msg').textContent = 'searching…';
  try {
    const results = await api('/api/geocode', { query: q });
    if (!results.length) { $('pk-msg').textContent = 'no results — drag the pin or type coords'; $('pk-results').innerHTML = ''; return; }
    $('pk-msg').textContent = '';
    $('pk-results').innerHTML = results
      .map((r, i) => `<li data-i="${i}">${r.name}${r.region ? ` · ${r.region.name}` : ''} <span class="muted">(${r.lat.toFixed(2)}, ${r.lng.toFixed(2)})</span></li>`)
      .join('');
    [...$('pk-results').children].forEach((li, i) => {
      li.onclick = () => { fillPickerFields(results[i]); $('pk-results').innerHTML = ''; };
    });
  } catch (e) { $('pk-msg').textContent = 'geocode failed: ' + e.message; }
}

function currentPickerLocation() {
  const name = $('pk-name').value.trim();
  const lat = parseFloat($('pk-lat').value), lng = parseFloat($('pk-lng').value);
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const loc = { name, lat, lng };
  const regionName = $('pk-region').value.trim();
  // region needs coords; reuse the geocoded region, applying a renamed label if edited
  if (pickerRegion && regionName) loc.region = regionName === pickerRegion.name ? pickerRegion : { ...pickerRegion, name: regionName };
  return loc;
}

function closePicker(result) {
  $('picker').hidden = true;
  const r = pickerResolve; pickerResolve = null;
  if (r) r(result);
}

function openLocationPicker({ initial, known } = {}) {
  return new Promise((resolve) => {
    pickerResolve = resolve;
    $('picker').hidden = false;
    ensurePickerMap();
    if (pickerMap) setTimeout(() => pickerMap.invalidateSize(), 0);
    $('pk-search').value = '';
    $('pk-results').innerHTML = '';
    $('pk-msg').textContent = window.L ? '' : 'map unavailable — use search + coords';
    renderChips(known || []);
    fillPickerFields(initial || null);
  });
}

$('pk-go').onclick = pkSearch;
$('pk-search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); pkSearch(); } });
$('pk-cancel').onclick = () => closePicker(null);
$('pk-ok').onclick = () => {
  const loc = currentPickerLocation();
  if (!loc) { $('pk-msg').textContent = 'need a place name + lat/lng'; return; }
  closePicker(loc);
};
$('loc-edit').onclick = async () => {
  const loc = await openLocationPicker({ initial: rollLoc(), known: knownLocations(rollLoc(), frames) });
  if (loc) setRollLocation(loc);
};
```

- [ ] **Step 4: Rewire frame + bulk to the picker; fix scan + edit load**

In `scripts/admin/app.js`, replace `setFrameLocation` and `pickLocation` (delete `pickLocation` entirely) with:

```js
async function setFrameLocation(i) {
  const loc = await openLocationPicker({
    initial: frames[i].location || rollLoc(),
    known: knownLocations(rollLoc(), frames),
  });
  if (!loc) return;
  fillForward(frames, i, loc);
  render();
}
```

Replace the `$('bulk-loc').onclick` handler with:

```js
$('bulk-loc').onclick = async () => {
  const selected = [...document.querySelectorAll('.frame')].filter((el) => el.querySelector('.sel').checked).map((el) => +el.dataset.i);
  if (!selected.length) return alert('select frames first');
  const loc = await openLocationPicker({ initial: null, known: knownLocations(rollLoc(), frames) });
  if (!loc) return;
  selected.forEach((i) => { frames[i].location = loc; frames[i].explicit = true; });
  render();
};
```

Delete the entire old roll-location search handler — the whole `$('loc-go').onclick = async () => { … };` block (it references `#loc-search`/`#loc-results`/`#loc-name` which no longer exist as a search UI; after the HTML change `$('loc-go')` is `null` and assigning `.onclick` on it throws at load, breaking the admin). The new `$('loc-edit').onclick` handler (added in Step 3) replaces it.

In the `$('scan').onclick` handler, delete the now-dangling line referencing the removed search box:

```js
    if (parsed.country && !$('loc-search').value) $('loc-search').value = parsed.country;
```

In the `$('roll-picker').onchange` handler, replace the three lines that set `loc-name`/`loc-lat`/`loc-lng` with a single call:

```js
  setRollLocation(roll.meta.location);
```

(Leave the rest of that handler — `frames = roll.frames.map(...)` — unchanged; `f.location` already carries `region` from the server.)

- [ ] **Step 5: Manual verification**

Run: `npm run admin`, open http://127.0.0.1:4322, then:
1. Click **set location** (roll) → search "Hoi An" → click a result. Confirm the map pin drops, the place + region show in the summary (`Hoi An · Vietnam`), and the slug updates.
2. Scan a folder (or pick an existing roll from the dropdown). On a frame, click **change** → confirm the picker opens seeded with chips for the roll's known locations; click a chip → frame location updates; setting one frame fills forward.
3. Drag the map pin → lat/lng fields update.
4. Select a couple of frames, **set location for selected** → assign via picker.
5. Click **write roll**, then inspect the written markdown:

```bash
sed -n '1,20p' src/content/photos/<the-slug>.md
```

Expected: the roll `location` has a nested `region:` and per-frame overrides carry `region:` where set. Revert any test write with `git checkout -- src/content/photos src/assets/photos` if it was a throwaway.

Stop the server (Ctrl-C).

- [ ] **Step 6: Commit**

```bash
git add scripts/admin/index.html scripts/admin/app.js
git commit -m "Replace admin prompt() location flow with a shared Leaflet picker"
```

---

## Task 8: One-time migration of existing rolls

**Files:**
- Create: `scripts/migrate-locations.mjs`

- [ ] **Step 1: Write the migration script**

Create `scripts/migrate-locations.mjs`:

```js
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
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(country)}`;
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
```

- [ ] **Step 2: Dry-run and review**

Run: `node scripts/migrate-locations.mjs`
Expected: a per-file line showing `old name → clean name · Country` for each roll, ending with `dry-run`. No files modified (`git status --short` clean).

- [ ] **Step 3: Apply, then verify build**

Run: `node scripts/migrate-locations.mjs --write`
Then: `rm -rf .astro && npm run build 2>&1 | tail -3`
Expected: build completes.

Run: `grep -c 'class="tooltip-sub"' dist/photos/index.html`
Expected: now `> 0` for any country with multiple cities — confirms grouped pins with breakdown render.

Run: `npm test 2>&1 | grep -E "pass|fail"`
Expected: all pass.

- [ ] **Step 4: Commit**

```bash
git add scripts/migrate-locations.mjs src/content/photos
git commit -m "Add location migration script and backfill existing rolls"
```

---

## Task 9: Documentation

**Files:**
- Modify: `docs/architecture.md`
- Modify: `docs/photography.md`

- [ ] **Step 1: Update architecture.md — content collections**

In `docs/architecture.md`, in the `photos` collection description, after the sentence ending `…an optional per-photo `location` override.` add:

```markdown
Each `location` is `{ name, lat, lng }` with an optional `region` (the primary,
e.g. a country) of the same shape — the place is the secondary. `region` is
optional and backward compatible.
```

- [ ] **Step 2: Update architecture.md — the photos map**

In `docs/architecture.md`, replace the "Pins are aggregated from per-photo effective locations…" paragraph's first sentence so it describes region grouping:

```markdown
Pins are aggregated by **primary region**: `src/data/locations.ts` exports
`aggregatePins(rolls)`, which groups every roll's effective locations by
`region.name` (falling back to the place name), yielding one pin per country
positioned at the region, with the member cities listed in the tooltip. Counts
sum across the group. `effectiveLocations(roll)` still drives the per-roll `+N`
label on `RollRow`.
```

- [ ] **Step 3: Update photography.md — location workflow**

In `docs/photography.md`, in the frontmatter/field description for a roll, document the region field and the picker. Add after the location field is introduced:

```markdown
Locations carry an optional `region` (country) alongside the specific place, so
the map shows one pin per country with a city breakdown. The roll-import admin
(`npm run admin`) fills both from one search — its location picker (search +
interactive map + reusable chips of the roll's known locations) replaces typing,
and the chosen place's country becomes the `region` automatically. Drag the map
pin to fine-tune coordinates.
```

- [ ] **Step 4: Verify + commit**

Run: `git diff --stat docs/`
Expected: both docs changed.

```bash
git add docs/architecture.md docs/photography.md
git commit -m "Document the region location model and admin picker"
```

---

## Final verification

- [ ] Run `rm -rf .astro && npm run build 2>&1 | tail -3` → `[build] Complete!`
- [ ] Run `npm test 2>&1 | grep -E "tests|pass|fail"` → all pass, 0 fail
- [ ] Run `npm run admin`, confirm the full picker flow once more (roll, frame, bulk, drag), then Ctrl-C
- [ ] Push: `git push`
