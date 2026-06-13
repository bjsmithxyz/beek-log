# Roll-import admin + homepage rolls — design

## Context

Adding a film roll to bjsmith.xyz today is a multi-step manual chore:
`scripts/import-roll.mjs` resizes and renumbers scans **sorted by filename**
(no way to set frame order while seeing the photos), then prints a frontmatter
skeleton the user pastes into a hand-created `src/content/photos/<slug>.md`,
then the user hand-fills stock/date/location (including looking up lat/lng) and
commits manually. Rolls also don't appear on the homepage — only the `work`
collection does.

This design replaces that with a local, dev-only admin web app that scans a
folder, shows thumbnails for drag-to-reorder, derives what it can from the
folder name, captures the rest through a form (with place-search geocoding),
writes the resized frames and the roll `.md`, and commits + pushes. It also
supports **editing** an existing roll, and surfaces recent rolls on the
homepage in a dedicated `rolls/` list.

## Goals

- One local UI to **create** and **edit** rolls; visual drag-to-reorder of frames.
- Derive date, film stock, and country from a folder named
  `YYYY-MM-DD - <film-stock>-<ISO>`; everything else entered in the form.
- Place-name search → automatic lat/lng (free, keyless), manual fallback.
- **Per-photo location**: a roll can span multiple places (e.g. China then
  Hong Kong) and each shows as its own pin on the map.
- One action writes files and commits + pushes (with a confirm step).
- Recent rolls listed on the homepage, each line linking to its roll page.
- No production surface area: the tool can never be deployed.

## Non-goals / out of scope

- No authentication (binds to localhost only; single local user).
- No in-browser cropping/colour edits — scans are used as-is (only resized).
- No bulk multi-roll import.
- Not an Astro route (see Architecture).

## Architecture

A **standalone local Node server**, started with `npm run admin`, not an Astro
`/admin` route. Rationale: an Astro route that shells out to `git push` would be
bundled into the deployed Netlify function and guarded only by a `DEV` check; a
separate local server is not part of the Astro build graph, so it has zero
production blast radius. It binds to `127.0.0.1` only and serves the site's
`global.css` so it stays on-brand.

**No new runtime dependencies.** Uses Node built-ins (`http`, `child_process`,
`fs`, global `fetch`, `Intl.DisplayNames`) plus the existing `sharp`. One new
**devDependency**: `yaml` (already deduped in the tree via Astro) for
reading/writing roll frontmatter in edit mode.

### Files

```
scripts/admin/
├── server.mjs    # localhost HTTP server + API endpoints
├── index.html    # single-page vanilla-JS UI (no build step)
└── lib.mjs       # pure functions (parse, slug, frontmatter, ordering)
scripts/admin/lib.test.mjs   # node:test unit tests for lib.mjs
```

`scripts/import-roll.mjs` is removed (superseded). README updated to document
`npm run admin`.

## Content model change (per-photo location)

`src/content/config.ts` photos collection gains an **optional per-photo
location override**; the existing roll-level `location` stays **required** and
acts as the primary/default:

```ts
const locationSchema = z.object({
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// roll-level (unchanged, required) — the roll's primary location + default
location: locationSchema,

photos: z.array(z.object({
  src: image(),
  alt: z.string(),
  caption: z.string().optional(),
  location: locationSchema.optional(),   // NEW: overrides roll default
})).min(1),
```

**Effective location** of a photo = `photo.location ?? roll.location`. This is
backward compatible: the existing sample roll (roll location, no overrides) is
unaffected. A small helper `effectiveLocations(roll)` is added (in a shared
module importable by the Astro pages, e.g. `src/data/locations.ts`) and used by
the map and roll views.

## Components

### server.mjs — endpoints

- `GET /` → serves `index.html`; `GET /global.css` → serves the site stylesheet.
- `GET /api/rolls` → lists existing rolls (slug, title, stock, date, frame count)
  by reading `src/content/photos/*.md`. Powers the edit picker.
- `GET /api/roll/:slug` → returns one roll's parsed frontmatter + body + the
  ordered existing frames as base64 thumbnails (read from
  `src/assets/photos/<slug>/`), including each frame's per-photo location override.
- `POST /api/scan` `{folder}` → reads image files in the folder, returns
  `{ parsed, frames: [{ srcPath, thumb }] }` where `parsed` is the
  folder-name derivation and `thumb` is an in-memory ~200px base64 JPEG.
  Nothing is written.
- `POST /api/geocode` `{query}` → proxies OpenStreetMap Nominatim (sets the
  required `User-Agent`, server-side to avoid CORS); returns
  `[{ name, lat, lng }]`.
- `POST /api/publish` → see Save logic. Body:
  ```
  { mode: 'create' | 'edit', slug, title, stock, date,
    location: { name, lat, lng },            // roll primary/default
    draft,
    frames: [ { srcPath } | { existing: 3 },
              alt, caption?,
              location?: { name, lat, lng } ],  // per-photo override
    commit: boolean }
  ```
  A frame's `location` is omitted when it equals the roll default (kept out of
  the `.md` to avoid noise).

### index.html — UI

Landing offers **New roll** or **Edit roll** (dropdown from `/api/rolls`).

Shared editor view:
- Folder input + **Scan** (create mode) / **Add frames** (edit mode).
- Thumbnail grid, **drag to reorder** (HTML5 drag-and-drop). Per frame: `alt`
  (pre-filled `"<location> — frame N"`, editable; satisfies the schema's
  required alt), optional `caption`, a **location** label, a checkbox for
  multi-select, and a remove (×).
- Metadata form: title; **stock** dropdown (from `film-stocks.ts`); date
  (defaults today or folder-derived); roll **primary location** search box →
  results list → pick fills name + lat/lng (manual lat/lng inputs as fallback);
  `draft` toggle.
- **Per-photo location (auto-tagging)**: every frame defaults to the roll
  primary location. A per-frame "set location" control opens the same place
  search; choosing a place **fills forward** to all following frames until the
  next explicit change. A "set location for selected" action bulk-assigns the
  multi-selected frames. Each thumbnail shows its effective location label so
  multi-place rolls are visible at a glance.
- **Slug** field auto-derived `YYYY-MM-<stock>-<place>`, editable, validated
  `^[a-z0-9-]+$`.
- Buttons: **Write roll** (commit: false) and **Write + commit + push**
  (commit: true). The push variant shows the computed commit message in a
  confirm step before running git.
- A log panel echoes the publish steps and any errors.

### lib.mjs — pure functions (unit-tested)

- `parseFolderName(basename)` → `{ date, stockSlug|null, iso|null, country|null }`.
  Split on `" - "`; first part validated `YYYY-MM-DD`; in the remainder the
  trailing `/-[A-Z]{2,3}$/` token is the ISO code, the prefix is the film-stock
  slug (preselected only on exact match against `filmStocks`); country via
  `new Intl.DisplayNames(['en'], { type: 'region' }).of(iso)`. Any failure
  yields nulls — never throws.
- `deriveSlug({ date, stockSlug, placeName })` → `YYYY-MM-<stock>-<place>`,
  place slugified from the first comma-separated token.
- `orderFrames(frames)` → final ordered list with `001…` numbering metadata.
- `buildFrontmatter({ ... })` / `parseRollFile(text)` → serialize and parse the
  `---` fenced YAML + markdown body (using `yaml`), round-tripping against the
  zod schema's shape (stock, date, location{name,lat,lng}, draft, photos[]
  with optional per-photo location). `buildFrontmatter` omits a frame's
  `location` when it equals the roll default.
- `effectiveLocations(roll)` → de-duplicated list of `{ name, lat, lng, count }`
  across the roll's photos (using `photo.location ?? roll.location`). Lives in a
  shared module (`src/data/locations.ts`) so the Astro map/index/roll pages
  import the same logic. Locations are keyed by name (case-insensitive) so
  "Hong Kong" frames collapse to one entry.

## Folder-name derivation

Folder `2026-06-02 - kodak-portra-400-PT` →
`{ date: '2026-06-02', stockSlug: 'kodak-portra-400', iso: 'PT', country: 'Portugal' }`.
The form pre-fills date and stock, and seeds the location search with the
country. The user still picks the precise place (which sets lat/lng).

## Save logic (create and edit share one path)

`/api/publish` resolves the final ordered frame list, then:

1. Validate: slug matches `^[a-z0-9-]+$`; stock exists in `film-stocks.ts`;
   date is valid; roll location has name + numeric lat/lng; ≥1 frame; every
   frame has non-empty alt; any per-photo location override has a valid
   name + numeric lat/lng.
2. Build the frame directory in a temp path `src/assets/photos/.tmp-<slug>/`:
   for each frame in order, **new** frames (`srcPath`) are sharp-processed
   (auto-orient, ≤2048px, JPEG q80, mozjpeg, metadata stripped) and **existing**
   frames (`existing: N`) are **copied losslessly** from the current roll dir.
   Output named `001.jpg`, `002.jpg`, … in final order.
3. Write `src/content/photos/<slug>.md` from `buildFrontmatter`, preserving the
   existing markdown body in edit mode (default body in create mode).
4. Atomically swap: remove any existing `src/assets/photos/<slug>/`, rename the
   temp dir into place. (Create-mode collision: if the dir already exists, the
   UI warns before overwrite.)
5. If `commit`: `git add` the roll `.md` + photos dir, `git commit -m
   "<Add|Update> <title> roll (<stock display name>)"`, `git push`. Each git
   call uses `execFile` (no shell), surfaces stdout/stderr to the log.

The temp-dir rebuild makes reorder/add/remove collision-proof and idempotent;
lossless copies of unchanged frames avoid re-encode quality loss.

## Homepage rolls section

`src/pages/index.astro` additionally loads
`getCollection('photos', ({ data }) => !data.draft)`, sorts by date desc, takes
the most recent **5**, and renders a new `rolls/` directory list below
`recent/`, reusing the existing `RollRow.astro` (already links to
`/photos/<slug>`), with a "view all →" link to `/photos`. Section hidden when
there are no published rolls. A roll's row shows its primary location name,
suffixed `+N` when `effectiveLocations(roll)` finds additional distinct places.

## Map and roll views (per-photo location)

- `src/pages/photos/index.astro` builds map pins from
  `effectiveLocations(roll)` across all rolls instead of one pin per roll.
  Pins are de-duplicated by location name; the tooltip shows the location name
  and total photo count there; clicking jumps to the most recent roll that has
  a photo at that location (`#roll-<slug>`, unchanged anchor behaviour).
- `src/pages/photos/[roll].astro` lightbox `data-meta` shows each frame's
  **effective** location (override or roll default), so a China/Hong-Kong roll
  reads correctly frame to frame. `WorldMap.astro` pin props are unchanged in
  shape; only the index page's aggregation changes.

## Error handling

- Scan: missing folder / no images → inline error, no state change.
- Geocode: network failure or no results → keep manual lat/lng fields usable.
- Publish validation failures → listed in the log, nothing written.
- Existing slug dir on create → confirm-overwrite prompt.
- `git push` failure → stderr shown; files are already written and committed
  locally, so the user can retry the push manually. (Commit happens before push;
  a push failure leaves a clean local commit.)

## Security

- Server binds `127.0.0.1` only; never `0.0.0.0`.
- Slug validated `^[a-z0-9-]+$` before any path is constructed (blocks
  traversal); all write paths confined under `src/assets/photos` and
  `src/content/photos`.
- `scan`/`add frames` read only the user-supplied folder; thumbnails are
  in-memory until publish.
- Nominatim accessed server-side with a descriptive `User-Agent`; used
  occasionally (well within the 1 req/sec policy).
- git invoked via `execFile` with argument arrays (no shell interpolation).

## Testing

- `lib.test.mjs` (`node:test`): `parseFolderName` (happy path, multi-token
  stock, missing/garbled name, lowercase iso, unknown stock), `deriveSlug`,
  `orderFrames`, `effectiveLocations` (single location, override fill,
  de-dup by name), and `buildFrontmatter`↔`parseRollFile` round-trip (including
  per-photo location overrides, and omission when equal to the roll default)
  whose output parses against the photos zod schema.
- Smoke test: `scan` a fixture folder, `publish` with `commit:false` into a temp
  repo path, assert frames written `001…` in order and the `.md` parses; then an
  edit round (reorder + add + remove + a per-photo location override) and assert
  renumbering and that the override survives the round-trip.
- Manual: `npm run admin`, create the sample roll, edit it, confirm the homepage
  `rolls/` list and `/photos` map/listing update after `npm run dev`.

## Dependencies summary

- Runtime: unchanged (no new deps).
- Dev: add `yaml` (explicit; already in tree).

## Cleanup (remove superseded artefacts)

- Remove `scripts/import-roll.mjs` (replaced by the admin).
- Update README's "Adding a Roll of Film" section to document `npm run admin`
  (create + edit, folder-name convention, per-photo location) and drop the old
  manual `import-roll.mjs` instructions.
- Remove any now-dead references to the old flow; keep
  `scripts/compress-images.mjs` and `generate-*` scripts (still used).
- The draft sample roll `2026-05-portra-400-tokyo` is retained as a dev fixture
  (useful for exercising edit mode); remove once a real roll exists.

## Deferred (not in this work)

- Astro 5 → 6 + `@astrojs/netlify` 6 → 7 upgrade (breaking: legacy
  content-collections API → Content Layer). Separate migration effort.
