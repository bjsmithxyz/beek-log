# Admin: Optional Alt Text + Click-to-Expand Preview — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the local roll-admin publish frames with no alt text, and let a frame thumbnail be clicked to open a ~1024px preview without loading the multi-MB source scan.

**Architecture:** Two pure helpers added to `scripts/admin/lib.mjs` (validation + preview-path guard) make the behavior changes unit-testable in `lib.test.mjs`. The admin server (`server.mjs`) consumes them and gains a `POST /api/preview` endpoint. The admin client (`app.js` + `index.html`) gains a click-to-expand overlay. One cosmetic guard in the public `Lightbox.astro` hides the caption line when a frame has no alt/caption.

**Tech Stack:** Node `node:http` server, `sharp` for image resizing, `yaml`, vanilla browser JS/CSS, Astro 6 (public components). Tests via `node --test`.

## Global Constraints

- The admin server is dev-only: binds `127.0.0.1`, started with `npm run admin`, never part of the Astro build. Do not change that.
- Runtime: Node ≥ 22.12.
- `scripts/admin/lib.mjs` is pure: **no I/O, no Astro imports.** New helpers there must take side effects (e.g. file existence) as injected functions.
- Test runner: `npm test` (`node --test`). All tests stay green.
- Public output change is limited to the single empty-caption guard in `Lightbox.astro`; no other public component changes.
- Preview is returned as a base64 data URL (same shape as the existing `thumb()`), and the frame image itself is the click target (no separate button).

---

### Task 1: Optional alt text (extract validator, drop the alt requirement)

**Files:**
- Modify: `scripts/admin/lib.mjs` (add `rollInputErrors`)
- Modify: `scripts/admin/server.mjs:195-215` (use the helper; the alt check is gone)
- Test: `scripts/admin/lib.test.mjs`

**Interfaces:**
- Produces: `rollInputErrors(body, filmStocks) -> string[]`, where `body` is `{ slug, sourceSlug?, stock, date, location, frames }` and `filmStocks` is the stock map. Returns a (possibly empty) array of error strings. Pure — no I/O. It does **not** check alt text.

- [ ] **Step 1: Write the failing test**

Append to `scripts/admin/lib.test.mjs`:

```js
import { rollInputErrors } from './lib.mjs';

const validStocks = { 'kodak-portra-400': {} };
const okBody = {
  slug: '2026-06-kodak-portra-400-lisbon',
  stock: 'kodak-portra-400',
  date: '2026-06-02',
  location: { name: 'Lisbon', lat: 38.72, lng: -9.13 },
  frames: [{ alt: '' }, { alt: 'tram 28' }],
};

test('rollInputErrors: a blank alt is allowed', () => {
  assert.deepEqual(rollInputErrors(okBody, validStocks), []);
});

test('rollInputErrors: still catches an unknown stock', () => {
  const errs = rollInputErrors({ ...okBody, stock: 'nope' }, validStocks);
  assert.ok(errs.some((e) => e.includes('unknown stock')));
});

test('rollInputErrors: still requires a roll location', () => {
  const errs = rollInputErrors({ ...okBody, location: null }, validStocks);
  assert.ok(errs.some((e) => e.includes('roll location')));
});

test('rollInputErrors: still flags a bad per-frame location', () => {
  const errs = rollInputErrors(
    { ...okBody, frames: [{ alt: '', location: { name: '', lat: 1, lng: 2 } }] },
    validStocks,
  );
  assert.ok(errs.some((e) => e.includes('frame 1 location invalid')));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `rollInputErrors` is not exported (`SyntaxError`/`does not provide an export named 'rollInputErrors'`).

- [ ] **Step 3: Add the helper to `lib.mjs`**

Append to `scripts/admin/lib.mjs`:

```js
// Field validation for a publish request. Pure: takes the request body and the
// stock map, returns error strings. Alt text is intentionally NOT required.
export function rollInputErrors({ slug, sourceSlug, stock, date, location, frames }, filmStocks = {}) {
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
    if (f.location && (!f.location.name || !Number.isFinite(f.location.lat) || !Number.isFinite(f.location.lng))) {
      errors.push(`frame ${i + 1} location invalid`);
    }
    if (badRegion(f.location)) errors.push(`frame ${i + 1} region invalid`);
  });
  return errors;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all four new tests green, existing tests unchanged).

- [ ] **Step 5: Wire the helper into `server.mjs`**

In `scripts/admin/server.mjs`, update the lib import (line ~10):

```js
import { parseFolderName, parseRollMarkdown, rollInputErrors } from './lib.mjs';
```

Then replace the inline validation block (the current lines ~197-215, from `const errors = [];` through `if (errors.length) return send(res, 400, { error: errors.join('; ') });`) with:

```js
  const errors = rollInputErrors(body, filmStocks);
  if (errors.length) return send(res, 400, { error: errors.join('; ') });
```

Leave the destructuring at line ~195 and everything after the `if (errors.length)` line (overwrite guard, auth gate, write) untouched.

- [ ] **Step 6: Verify the server still parses and serves**

Run: `node --check scripts/admin/server.mjs`
Expected: no output (exit 0 — file parses).

- [ ] **Step 7: Commit**

```bash
git add scripts/admin/lib.mjs scripts/admin/lib.test.mjs scripts/admin/server.mjs
git commit -m "Admin: allow publishing frames with no alt text

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 2: Hide empty lightbox caption on public pages

**Files:**
- Modify: `src/components/Lightbox.astro:90` (caption fallback) and its `<style>` block (add `:empty` rule)

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces: nothing other tasks rely on.

- [ ] **Step 1: Update the caption fallback chain**

In `src/components/Lightbox.astro`, change line ~90 from:

```js
      lightboxCaption.textContent = item.dataset.caption ?? item.alt.split(' - ')[0];
```

to:

```js
      lightboxCaption.textContent = item.dataset.caption || item.alt.split(' - ')[0] || '';
```

(`||` so an explicitly-empty `data-caption` falls through to alt; the trailing `|| ''` guarantees a string, so the `:empty` rule below can match.)

- [ ] **Step 2: Add the `:empty` CSS guard**

In the same file's `<style>` block, directly after the existing rule:

```css
  .lightbox-content #lightbox-meta:empty {
    display: none;
  }
```

add:

```css
  .lightbox-content #lightbox-caption:empty {
    display: none;
  }
```

- [ ] **Step 3: Verify the site still builds**

Run: `npm run build`
Expected: build completes with no errors (confirms the `.astro` script/style edits are valid). A frame with both `data-caption=""` and `alt=""` now yields `textContent === ''`, which `#lightbox-caption:empty` hides — no blank caption line. (End-to-end visual check happens in Task 4's manual verification, once a no-alt frame can be published.)

- [ ] **Step 4: Commit**

```bash
git add src/components/Lightbox.astro
git commit -m "Lightbox: hide caption line when frame has no alt/caption

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 3: Preview endpoint + path in roll response (server)

**Files:**
- Modify: `scripts/admin/lib.mjs` (add `validatePreviewPath`)
- Modify: `scripts/admin/server.mjs` (add `preview()`, the `POST /api/preview` route, and a `path` field on `/api/roll` frames)
- Test: `scripts/admin/lib.test.mjs`

**Interfaces:**
- Consumes: from Task 1, the lib import line in `server.mjs` already pulls from `./lib.mjs`.
- Produces:
  - `validatePreviewPath(path, { imageRe, exists }) -> string | null` — pure; returns an error string or `null` when the path is a renderable existing image. `exists` is an injected `(path) => boolean`.
  - `POST /api/preview` with JSON body `{ path: string }` → `200 { src: "data:image/jpeg;base64,…" }` or `400 { error }`.
  - `GET /api/roll/:slug` frames each now include `path: <absolute file path>` (consumed by Task 4).

- [ ] **Step 1: Write the failing test**

Append to `scripts/admin/lib.test.mjs`:

```js
import { validatePreviewPath } from './lib.mjs';

const imageRe = /\.(jpe?g|png|tiff?|webp)$/i;

test('validatePreviewPath: accepts an existing image', () => {
  assert.equal(validatePreviewPath('/x/001.jpg', { imageRe, exists: () => true }), null);
});

test('validatePreviewPath: rejects a non-image extension', () => {
  assert.equal(validatePreviewPath('/x/notes.txt', { imageRe, exists: () => true }), 'not an image file');
});

test('validatePreviewPath: rejects a missing file', () => {
  assert.equal(validatePreviewPath('/x/001.jpg', { imageRe, exists: () => false }), 'file not found');
});

test('validatePreviewPath: rejects an empty path', () => {
  assert.equal(validatePreviewPath('', { imageRe, exists: () => true }), 'path required');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `validatePreviewPath` is not exported.

- [ ] **Step 3: Add the helper to `lib.mjs`**

Append to `scripts/admin/lib.mjs`:

```js
// Guards the dev-only /api/preview endpoint: only render existing image files.
// `exists` is injected so this stays pure (lib.mjs does no I/O).
export function validatePreviewPath(path, { imageRe, exists }) {
  if (!path || typeof path !== 'string') return 'path required';
  if (!imageRe.test(path)) return 'not an image file';
  if (!exists(path)) return 'file not found';
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (all four new tests green).

- [ ] **Step 5: Add the import, the `preview()` renderer, and the route to `server.mjs`**

Update the lib import line (built on Task 1's version):

```js
import { parseFolderName, parseRollMarkdown, rollInputErrors, validatePreviewPath } from './lib.mjs';
```

Directly after the existing `thumb()` function (ends at line ~62), add:

```js
async function preview(path) {
  const buf = await sharp(path)
    .rotate()
    .resize({ width: 1024, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  return `data:image/jpeg;base64,${buf.toString('base64')}`;
}
```

Add a new route. Place it next to the other `POST` routes (e.g. directly after the `POST /api/scan` route, which ends at line ~82):

```js
route('POST', /^\/api\/preview$/, async (req, res) => {
  const { path } = await readBody(req);
  const err = validatePreviewPath(path, { imageRe: IMAGE_RE, exists: existsSync });
  if (err) return send(res, 400, { error: err });
  send(res, 200, { src: await preview(path) });
});
```

(`IMAGE_RE` is already defined at line ~53; `existsSync` is already imported at line ~5.)

- [ ] **Step 6: Add `path` to each frame in the `/api/roll/:slug` response**

In the `GET /api/roll/:slug` handler, the frame push (currently lines ~169-175) becomes:

```js
    frames.push({
      existing: i + 1,
      path: filePath,
      thumb: await thumb(filePath),
      alt: p.alt,
      caption: p.caption ?? '',
      location: p.location ?? null,
    });
```

(`filePath` is already computed one line above as `join(PHOTOS_DIR, slug, ...)`.)

- [ ] **Step 7: Verify the server parses, then smoke-test the endpoint**

Run: `node --check scripts/admin/server.mjs`
Expected: exit 0.

Then smoke-test against a real asset (start the server, hit the endpoint, stop it). Pick any existing scan, e.g. one under `src/assets/photos/`:

```bash
npm run admin >/tmp/admin.log 2>&1 &
ADMIN_PID=$!
sleep 2
IMG=$(find src/assets/photos -name '001.jpg' | head -1)
echo "using: $IMG"
curl -s -X POST localhost:4322/api/preview -H 'content-type: application/json' \
  -d "{\"path\":\"$PWD/$IMG\"}" | head -c 50
echo
curl -s -X POST localhost:4322/api/preview -H 'content-type: application/json' \
  -d '{"path":"/etc/passwd"}'
echo
kill $ADMIN_PID
```

Expected: first call prints `{"src":"data:image/jpeg;base64,…` ; second prints `{"error":"not an image file"}`.

- [ ] **Step 8: Commit**

```bash
git add scripts/admin/lib.mjs scripts/admin/lib.test.mjs scripts/admin/server.mjs
git commit -m "Admin: add ~1024px /api/preview endpoint + frame path

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

### Task 4: Click-to-expand overlay (admin client)

**Files:**
- Modify: `scripts/admin/index.html` (overlay markup + CSS)
- Modify: `scripts/admin/app.js` (open/close + click handler; carry `path` on edit-mode frames)

**Interfaces:**
- Consumes: from Task 3, `POST /api/preview { path } -> { src }`, and the `path` field on `/api/roll` frames. Scanned frames already carry `srcPath` (set in the existing `$('scan').onclick`).
- Produces: nothing other tasks rely on (terminal task).

- [ ] **Step 1: Add the overlay markup to `index.html`**

In `scripts/admin/index.html`, immediately before the closing `</body>` (just before `<script src="/app.js" type="module"></script>` at line ~159), add:

```html
  <div id="preview" class="preview-overlay" hidden>
    <img id="preview-img" alt="" />
    <div id="preview-msg" class="muted">loading…</div>
  </div>
```

- [ ] **Step 2: Add the overlay CSS to `index.html`**

In the `<style>` block, after the `.gh-badge.checking` rule (line ~70), add:

```css
    .preview-overlay { position: fixed; inset: 0; z-index: 1100;
      background: rgba(0,0,0,.85); display: flex; align-items: center;
      justify-content: center; padding: 2rem; cursor: zoom-out; }
    .preview-overlay[hidden] { display: none; }
    .preview-overlay img { max-width: 95vw; max-height: 95vh;
      object-fit: contain; border: 1px solid var(--color-border); }
    #preview-msg { position: absolute; }
```

- [ ] **Step 3: Add open/close logic to `app.js`**

In `scripts/admin/app.js`, after the `render()` function (ends at line ~119), add:

```js
async function openPreview(f) {
  const overlay = $('preview'), img = $('preview-img'), msg = $('preview-msg');
  overlay.hidden = false;
  if (f.preview) { img.src = f.preview; msg.hidden = true; return; }
  img.removeAttribute('src');
  msg.hidden = false;
  msg.textContent = 'loading…';
  const path = f.srcPath || f.path;
  if (!path) { msg.textContent = 'no source file for this frame'; return; }
  try {
    const { src } = await api('/api/preview', { path });
    f.preview = src;       // cache so reopening is instant
    img.src = src;
    msg.hidden = true;
  } catch (e) {
    msg.textContent = 'preview failed: ' + e.message;
  }
}
function closePreview() { $('preview').hidden = true; }
$('preview').onclick = closePreview;
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !$('preview').hidden) closePreview();
});
```

- [ ] **Step 4: Wire the thumbnail click in `render()`**

In `render()`, inside the `frames.forEach((f, i) => { … })` loop, after the existing `el.querySelector('.del').onclick = …` line (~105), add:

```js
    el.querySelector('img').onclick = () => openPreview(f);
```

- [ ] **Step 5: Carry `path` onto edit-mode frames**

In the `$('roll-picker').onchange` handler, the frame mapping (currently lines ~226-229) becomes:

```js
  frames = roll.frames.map((f) => ({
    existing: f.existing, path: f.path, thumb: f.thumb, alt: f.alt, caption: f.caption,
    location: f.location, explicit: !!f.location,
  }));
```

(Scanned frames already get `srcPath` in `$('scan').onclick`, so no change is needed there.)

- [ ] **Step 6: Manual end-to-end verification**

Run: `npm run admin` and open `http://127.0.0.1:4322`. Verify all of:

1. **Scan + click:** enter a folder of scans, click `scan / add frames`, then click any thumbnail → a large (~1024px) preview opens, is sharp, and loads quickly. Click the backdrop or press `Esc` → it closes. Click the same thumbnail again → it reopens instantly (cached).
2. **No alt publish:** leave at least one frame's alt blank, set the required roll fields (title/stock/date/location), and click `write roll` → it succeeds (no `frame N needs alt text` error in the log).
3. **Edit-mode click:** pick that roll from `edit existing roll`, then click one of its thumbnails → the preview opens (uses the `path` from the roll response).
4. **Public caption (Task 2 payoff):** run `npm run build && npm run preview`, open the roll page, open the lightbox on the no-alt frame → no blank caption line appears above the meta line.

- [ ] **Step 7: Commit**

```bash
git add scripts/admin/index.html scripts/admin/app.js
git commit -m "Admin: click a frame thumbnail to open a ~1024px preview

Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Part A (optional alt) → Task 1 (drop the only blocker, `server.mjs:209`; schema untouched as the spec notes) + Task 2 (the approved empty-caption guard). ✓
- Part B (click-to-expand ~1024px) → Task 3 (endpoint + path sourcing for both scanned and existing frames) + Task 4 (overlay, click target = image, base64 data URL, caching). ✓
- Verification section of the spec → Task 1/3 `npm test`, Task 3 curl smoke, Task 4 Step 6 manual end-to-end (including the public no-blank-caption check). ✓
- Out of scope (no compression/import-pipeline/extra public changes) honored — only `Lightbox.astro` is touched outside `scripts/admin`. ✓

**Placeholder scan:** No TBD/TODO; every code step shows complete code and exact commands. ✓

**Type/name consistency:** `rollInputErrors(body, filmStocks)`, `validatePreviewPath(path, { imageRe, exists })`, route `/api/preview` with `{ path } → { src }`, and the frame `path` field are used identically across the tasks that define and consume them. The `Lightbox.astro` caption uses `||` (not `??`) so empty strings fall through and `#lightbox-caption:empty` can match. ✓
