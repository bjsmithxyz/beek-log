# Architecture

## Stack

- **[Astro 7](https://astro.build)** — public site prerendered; the isolated
  `admin/` workspace runs Astro SSR.
- **[@astrojs/netlify](https://docs.astro.build/en/guides/integrations-guide/netlify/)** —
  routes `astro:assets` images through the Netlify Image CDN in production (see
  [images-and-assets.md](images-and-assets.md)).
- **[Sharp](https://sharp.pixelplumbing.com/)** — image processing for the build
  and maintenance scripts.
- **[@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)**
  + a hand-written RSS endpoint (`src/pages/rss.xml.js`).
- **[@fontsource/ibm-plex-mono](https://fontsource.org/)** — self-hosted; no
  external font requests.

Design language is terminal / file-browser brutalism: monospace, square corners,
hard offset shadows, a faint dot grid, dark default with a light toggle. Tokens
live in `src/styles/global.css`; `admin/src/styles/global.css` mirrors them
(keeping short aliases `--bg`, `--panel`, `--accent`) so both surfaces stay one
design system. `admin/test/admin-format.test.mjs` asserts the two palettes are
value-for-value identical.

## Navigation

Every page carries a filesystem-style breadcrumb in a static 56px top row (not
sticky chrome). Each segment is its own link to a real route; the current
segment uses `aria-current="page"`; long paths scroll horizontally. Public
sections live under `~/beek`, admin under `~/admin`. Public and admin use
workspace-local components so the admin stays isolated from the public rendering
boundary.

The homepage (`~`) is a filesystem site index: the protected `admin/`
destination first, then a collapsible `beek/` tree (open by default; `work/` and
`photos/` collapsed, work grouped into `dev/`/`art/`, photos into newest-first
year subsections). The admin dashboard (`admin/src/components/AdminTree.astro`)
repeats the format, but its `rolls/`/`travel/` branches are populated live by a
client fetch of `/.netlify/functions/rolls-data` and `travel-data`
(`admin/src/lib/roll-tree.mjs`, unit-tested); a fetch failure degrades a leaf to
"offline". Only the listing is live — editors are separate pages.

## Project structure

```text
/
├── public/          # Static assets (favicons, robots.txt, og-image)
├── scripts/         # Build, image-maintenance, and verification utilities
├── shared/          # Pure authoring rules used by public + admin tooling
├── admin/           # Astro SSR admin + Netlify Functions
├── docs/            # This documentation
├── src/
│   ├── assets/      # images/ (work), photos/ (film scans, one folder per roll)
│   ├── components/  # Reusable Astro components
│   ├── content/     # work/ and photos/ markdown (one file per entry/roll)
│   ├── data/        # trips.json, locations.ts, site.ts
│   ├── layouts/     # BaseLayout.astro
│   ├── lib/         # collections, highlights, dates helpers
│   ├── pages/       # index, work, photos, travel, about, rss.xml, 404
│   └── styles/      # global.css (design tokens)
├── astro.config.mjs # Netlify adapter + sitemap
├── netlify.toml     # Headers, caching, build settings
└── package.json     # npm workspace root
```

## Site boundary

The public site is prerendered, secret-free, and session-unaware. The admin is a
separate Netlify site built from `admin/`; its middleware protects all tool
routes and its functions own GitHub App OAuth. Session cookies are host-only to
`admin.bjsmith.xyz`.

`shared/` is an npm workspace package of pure film/slug/Markdown/location/trip
rules — no Astro or Node I/O dependencies.

## Admin publication model

Authenticated reads and mutations pass through Netlify Functions; GitHub tokens
never reach browser JS. The publisher (`admin/src/server/publisher.mjs`) accepts
a server-policy-checked set of create/update/delete ops, verifies expected blob
SHAs against `main`, builds one Git tree + commit, and fast-forwards
`refs/heads/main`. It then best-effort POSTs `NETLIFY_BUILD_HOOK` so
`bjsmith.xyz` rebuilds promptly. No PRs for content. Concurrent edits fail with a
stale-base/stale-content error so the editor can reload and retry. Server path
policy allows only `src/data/trips.json` (travel) and numbered roll assets +
Markdown; the browser cannot choose an arbitrary path.

### Hosted image pipeline

The roll uploader is desktop/capability-gated. Two bounded Web Workers decode
with browser image APIs, apply orientation, resize to a 2048px long edge, and
encode quality-80 MozJPEG-family output with `@jsquash/jpeg` (re-encoding strips
source metadata). Encoded JPEGs pass through the same-origin `blob-upload`
Function, which takes no path and returns only a Git blob SHA
(`admin/src/lib/store-bytes.js` is the sole client storage boundary, isolating a
future object-store swap). The final request maps SHAs to server-generated
paths, verifies the complete inventory, and commits atomically. The admin-only
CSP adds `'wasm-unsafe-eval'`; the public CSP is unchanged.

## Content collections

Defined in `src/content.config.ts` with Zod schemas, loaded via `glob()`, keyed
by filename `id`, rendered with `render(entry)`.

- **`work`** — dev/art/photography entries: `title`, `description`, `date`,
  `category`, `tags`, `draft`, optional `liveUrl`/`repoUrl`/`cover`/`images`.
- **`photos`** — one per film roll: `title`, `stock` (validated against
  `shared/film-stocks.ts`), `date`, roll-level `location`, `draft`, and
  `photos[]` where each frame has `src`, `alt`, optional `caption`,
  `location` override, and `featured`. See [photography.md](photography.md).

`location` is `{ name, lat, lng }` with an optional same-shape `region` (e.g.
country). Draft photo entries render in dev and Deploy Previews but are excluded
from production builds, RSS, and the sitemap.

## Travel

`/travel/` is a read-only Astro page backed by `src/data/trips.json` (validated
in tests and the build).

**The public page publishes places, never a schedule.** Exact dates, notes, and
tentative flags are withheld; future stops ship as a dateless `planned` route.
This is enforced at build time: `shared/trip-public.mjs` reduces the itinerary
and only that result is embedded, so `trips.json` never enters the client bundle.
Consequently past/current status is decided at build time; only the day counter
stays live (derived from the first published arrival). `refresh-travel.yml`
rebuilds on public-path pushes and nightly so "here now" stays fresh. When the
current stop is tentative or between stops, the page says "last seen in *place*"
— never naming the next stop. `verify-travel-build.mjs` asserts no withheld name
or date leaks into the page or shipped scripts; `verify-travel-clock.mjs` asserts
the counter advances under a moving clock while the published set does not.

Three keyboard-operable tabs show stats, route, or timeline. The planned route
renders on `route/` as a dashed amber layer + place chips (names/coords, no
dates); Leaflet is recreated after the panel is visible so it gets real
dimensions. Route stops link to photo rolls matching by normalized place name or
80 km proximity.

**Weather without the network:** typical monthly climate follows from place +
month, both already published. `scripts/fetch-climate.mjs` resolves ten-year
Open-Meteo ERA5 normals into `src/data/climate.json`; `shared/trip-climate.mjs`
looks them up and `trip-public.mjs` joins one onto each stop, so the browser
renders highs/lows/rain/daylight with no requests. Regenerate with
`npm run climate` after adding stops; a stop with no normal renders without
weather and the build warns rather than fails.

`admin/src/pages/travel/` is the only surface that renders exact dates, notes, or
tentative flags, behind an amber privacy notice.

## Photo curation: selects and highlights

Each frame carries optional `featured` (default `false`), set per-frame in the
admin roll editor. A roll with ≥1 featured frame renders a **selects** grid by
default on `/photos/<roll>/`, with the full contact sheet demoted to a collapsed
`<details>`; a roll with none renders the full contact sheet directly.
`/photos/highlights/` aggregates every featured frame across all rolls into one
grid (`src/lib/highlights.ts` is the shared source of truth for that list and
the `/photos/` promo); each tile links to `/photos/<roll>/#frame-N`, which the
`Lightbox` opens via hash deep-link. `highlights` is a reserved roll slug
(`shared/roll-markdown.mjs`) so a roll can't shadow the route.

The public `/photos/` index carries no archive statistics; the equivalent
numbers (rolls, frames, stocks, selects) live as a one-line summary atop the
admin's `/rolls/`, for the owner only.
