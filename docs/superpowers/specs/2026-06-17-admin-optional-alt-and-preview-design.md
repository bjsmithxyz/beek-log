# Admin: optional alt text + click-to-expand preview

Date: 2026-06-17

## Summary

Two changes to the local roll-admin tool (`scripts/admin/*`), plus one cosmetic
guard in the shared public `Lightbox.astro`:

1. **Optional alt text** — let a roll be published from the admin when a frame
   has no alt text. Today the publish endpoint rejects any frame with a blank
   alt.
2. **Click-to-expand preview** — clicking a frame thumbnail in the admin opens a
   larger (~1024px) preview so a scan's focus/framing can be checked before
   publishing, without loading the multi-MB source file.

The admin server (`scripts/admin/server.mjs`) is dev-only, binds `127.0.0.1`,
and is never part of the Astro build. Start it with `npm run admin`.

## Part A — optional alt text

### Current behaviour

Three layers touch alt text; only one actually blocks a no-alt publish:

- `scripts/admin/server.mjs:209` — `if (!f.alt || !f.alt.trim()) errors.push(...)`.
  **This is the only blocker.** It rejects the whole publish if any frame's alt
  is blank.
- Content schema `src/content.config.ts:52` — `alt: z.string()`. Accepts the
  empty string, so it does **not** need to change.
- Rendering already tolerates an empty alt: `src/pages/work/[slug].astro:134`
  guards `{img.alt && <figcaption>…}`; `FilmStrip.astro` uses alt only as a
  caption fallback.

### Changes

1. **`scripts/admin/server.mjs`** — remove the per-frame alt requirement (the
   line at ~209). Every other validation rule stays (slug, stock, date, roll
   location, per-frame location, region).
2. **No schema change.** The publish payload already sends `alt: f.alt` (the
   empty string when blank); `lib.mjs` serialises `alt: ''`; the schema's
   `z.string()` accepts it.
3. **No admin-grid change.** The alt `<input>` stays exactly as is (placeholder
   `alt`), just no longer mandatory — so the admin page layout is unchanged.

### Public clean-up (the one out-of-`admin` edit)

A frame with no alt and no caption would otherwise render a blank caption line in
the public lightbox (caption falls back to alt, which is empty). To keep
published pages clean:

- **`src/components/Lightbox.astro`** — caption fallback chain becomes
  `caption → alt-before-" - " → ''`, explicitly setting an empty string when all
  are blank, and add CSS `#lightbox-caption:empty { display: none }`. This
  mirrors the existing `#lightbox-meta:empty { display: none }` rule.

`FilmStrip.astro`'s `data-caption={p.caption ?? p.alt}` already yields `''` when
both are empty, so no change is needed there.

## Part B — click-to-expand preview (~1024px)

### Current behaviour

`scripts/admin/server.mjs` `thumb()` renders each frame to a 220×220
(`fit: 'inside'`), quality-60 JPEG and returns it as an inline base64 data URL.
The admin grid shows it at 150px wide. There is no way to view a frame larger;
the raw source scans are multi-MB and are never served to the browser.

### Changes

1. **New endpoint — `POST /api/preview { path }`** in `server.mjs`:
   - Validate `path` against the existing `IMAGE_RE` and `existsSync`; reject
     anything else (the server is local-only, but the guard prevents reading
     arbitrary files).
   - Render with
     `sharp(path).rotate().resize({ width: 1024, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 70 }).toBuffer()`.
   - Return a base64 data URL — the same shape `thumb()` already returns
     (`data:image/jpeg;base64,…`).
   - Expected size ~100–200KB; sharp enough to judge a scan, far smaller and
     faster than the source file.
2. **Path sourcing** — the client must always have a `path` to send:
   - Scanned (new) frames already carry `f.srcPath`.
   - Existing (edit-mode) frames: add the resolved file path to each frame in
     the `/api/roll/:slug` response (e.g. `path: filePath`), and keep it on the
     client frame object so it can be sent to `/api/preview`.
3. **`scripts/admin/app.js` + `scripts/admin/index.html`:**
   - Clicking a frame's `<img>` opens an overlay and fetches its preview. Show a
     "loading…" line while sharp renders; cache the returned data URL on the
     frame object (e.g. `f.preview`) to avoid refetching on reopen.
   - Esc or a backdrop click closes the overlay. Reuse the existing
     `.picker-overlay` styling pattern in `index.html`.
   - A plain click on the image opens the preview; drag-to-reorder continues to
     work through the existing `dragstart` handler (a drag is not a click).

### Decisions (settled)

- Preview is returned as a **base64 data URL**, consistent with `thumb()` —
  simpler than streaming bytes and keeps everything same-origin.
- The **image itself is the click target** to expand; no separate expand button.

## Verification

- `npm test` (`node --test`) stays green — no existing test covers the removed
  alt check or the new endpoint. If any preview path-validation logic is worth
  isolating, factor it into a pure helper and add a small unit test alongside
  the existing `lib.test.mjs` / `publish.test.mjs`; otherwise rely on manual
  verification.
- Manual, via `npm run admin`:
  - Scan a folder, leave a frame's alt blank, and publish — it succeeds.
  - Click a frame thumbnail — a ~1024px preview opens quickly and is sharp.
- Public: build a roll containing an empty-alt frame, open its lightbox, and
  confirm no blank caption line appears.

## Out of scope

- No change to the public photo pages beyond the single empty-caption guard.
- No change to image compression, the import pipeline, or how source scans are
  stored.
