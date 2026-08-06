# Architecture

## Stack

- **[Astro 7](https://astro.build)** — the public site's pages are prerendered;
  the isolated admin workspace uses Astro SSR.
- **[@astrojs/netlify](https://docs.astro.build/en/guides/integrations-guide/netlify/)**
  adapter — routes `astro:assets` images through the Netlify Image CDN in
  production (see [images-and-assets.md](images-and-assets.md)).
- **[Sharp](https://sharp.pixelplumbing.com/)** — image processing, used by the
  build and by the maintenance scripts.
- **[@astrojs/sitemap](https://docs.astro.build/en/guides/integrations-guide/sitemap/)**
  + a hand-written RSS endpoint (`src/pages/rss.xml.js`).
- **[@fontsource/ibm-plex-mono](https://fontsource.org/)** — the site is
  self-hosted IBM Plex Mono; there are no external font requests.

Design language is terminal / file-browser brutalism: monospace, square
corners, hard offset shadows, a faint dot grid, and a dark default theme with a
light toggle. Tokens live in `src/styles/global.css`, and
`admin/src/styles/global.css` mirrors that vocabulary and both palettes so the
two surfaces stay one design system; the admin keeps its short aliases
(`--bg`, `--panel`, `--accent`) as pointers into the shared tokens.

Every page places semantic filesystem-style breadcrumb navigation in a static
56px row at the top of the page flow, not in sticky chrome, so nothing floats
over the grid as the page scrolls. The theme control uses the same icon
treatment as the social links and sits at the footer's bottom-right,
immediately above the copyright, on both surfaces. Keeping the path in each
workspace's layout gives every route the
same screen position regardless of content width. The public homepage is `~`,
public sections and files live below `~/beek`, and the admin dashboard and tools live
below `~/admin`. Each segment maps to a real route, the current self-link uses
`aria-current="page"`, and long paths scroll horizontally on narrow screens.
Public and admin use workspace-local Astro components so the admin remains
isolated from the public rendering boundary.

The root route is a filesystem-style site index: `~` lists the single protected
`admin/` destination first, followed by an animated, collapsible `beek/` tree.
Only branches with children expose disclosure controls; `beek/` starts open,
while `work/` and `photos/` start collapsed. Work entries are grouped into
collapsed `dev/` and `art/` subsections, and photo rolls into dynamically
generated, newest-first year subsections. The tree is the homepage content
rather than a preface to duplicate recent-content listings.

The admin repeats that format rather than inventing its own. `~/admin` is the
same filesystem index — `beek/` links back to the public site and a collapsible
`admin/` branch holds `rolls/` and `travel/` — and both workspaces share the
page shell (skip link, static breadcrumb row, `PageHeader` with one page-title
size token, footer-owned theme toggle). The components are workspace-local
duplicates, not imports, so the admin stays isolated from the public rendering
boundary; `admin/test/admin-format.test.mjs` guards the two from drifting,
including asserting the palettes are value-for-value identical.

## Project structure

```text
/
├── public/          # Static assets (favicons, robots.txt, og-image)
├── scripts/         # Build, image-maintenance, and verification utilities
├── shared/          # Pure authoring rules used by public + admin tooling
├── admin/           # Astro SSR admin + Netlify Functions
├── docs/            # This documentation
├── src/
│   ├── assets/
│   │   ├── images/  # Images for work entries
│   │   └── photos/  # Film scans, one folder per roll
│   ├── components/  # Reusable Astro components
│   ├── content/
│   │   ├── work/    # One markdown file per project/art entry
│   │   └── photos/  # One markdown file per film roll
│   ├── data/        # trips.json, world-dots.json, locations.ts, site.ts
│   ├── layouts/     # BaseLayout.astro
│   ├── pages/       # Routes: index, work, photos, travel, about, rss.xml, 404
│   └── styles/      # global.css (design tokens)
├── astro.config.mjs # Netlify adapter + sitemap
├── netlify.toml     # Headers, caching, build settings
└── package.json     # npm workspace root
```

## Site boundary

The public site remains prerendered, secret-free and unaware of sessions. The
admin is a separate Netlify site built from `admin/`; its middleware protects
all tool routes and its functions own GitHub App OAuth. Session cookies are
host-only to `admin.bjsmith.xyz` and never sent to the public origin.

`shared/` is an npm workspace package containing pure film, slug, Markdown,
location and trip rules. It has no Astro or Node I/O dependencies.

## Admin publication model

Authenticated admin reads and mutations pass through Netlify Functions; GitHub
tokens never reach browser JavaScript. The generic publisher in
`admin/src/server/publisher.mjs` accepts a server-policy-checked set of create,
update and delete operations, verifies expected blob SHAs against `main`, builds
one Git tree and commit, and fast-forwards `refs/heads/main`. It does not open
pull requests for content publishes. Concurrent edits fail with a stale-base or
stale-content error so the editor can reload and retry.

Phase 3's travel editor is restricted to `src/data/trips.json`. Phase 4 extends
server path policy only to numbered film roll assets and Markdown; the browser
still cannot choose an arbitrary path. Manual code changes continue to use
normal feature-branch pull requests.

### Hosted image pipeline

The roll uploader is desktop/capability-gated. Two bounded Web Workers decode
with browser image APIs, apply orientation, resize to a 2048px long edge and
encode quality-80 MozJPEG-family output with `@jsquash/jpeg`. Source metadata is
removed by re-encoding. Thumbnails are separate and object URLs are revoked.
The admin-only CSP adds `'wasm-unsafe-eval'`; the public CSP is unchanged.

Encoded JPEGs pass through the authenticated, same-origin `blob-upload`
Function, which accepts no repository path and returns only a Git blob SHA.
`admin/src/lib/store-bytes.js` is the sole client storage boundary so a future
object-store migration can replace it. The final create/edit/rename/delete
request maps those SHAs to server-generated allowed paths, verifies the complete
current inventory, and commits all image and Markdown changes atomically to
`main`.

## Content collections

Defined in `src/content.config.ts` with Zod schemas. Both collections use the
Content Layer `glob()` loader; entries are keyed by `id` (the filename slug) and
rendered with `render(entry)` from `astro:content`.

**`work`** — dev / art / photography entries. Fields: `title`, `description`,
`date`, `category` (`dev` | `art` | `photography`), `tags`,
`draft`, optional `liveUrl` / `repoUrl`, optional `cover` image, optional
`images` gallery.

**`photos`** — one entry per developed film roll. Fields: `title`, `stock`
(a slug validated against `shared/film-stocks.ts`), `date`, roll-level
`location` (`{ name, lat, lng }`), `draft`, and `photos[]` where each frame has
`src`, `alt`, optional `caption`, and an optional per-photo `location` override.
See [photography.md](photography.md).

Each `location` is `{ name, lat, lng }` with an optional `region` (the primary,
e.g. a country) of the same shape — the place is the secondary. `region` is
optional and backward compatible.

Photo entries with `draft: true` render in the dev server and Netlify Deploy
Previews, but are excluded from production builds, RSS, and the production
sitemap.

## Travel

`/travel/` is a read-only Astro page backed by `src/data/trips.json`. The shared
trip validator runs in tests and during the build.

**The public page publishes places, never a schedule.** Exact dates, onward legs
and tentative stops are withheld. This is enforced where it cannot be worked
around: `shared/trip-public.mjs` reduces the itinerary at build time and only
that result is embedded in the page, so `trips.json` never enters the client
bundle at all. Filtering in the browser would not do — the full itinerary would
still ship to anyone who opened the JavaScript.

The cost is that past/current status is decided at build time rather than by the
browser. That is a deliberate reversal of the earlier design: computing status
client-side requires giving the client every stop's dates, which is precisely
what may not be published. Only the day counter stays live, derived from the one
date the payload keeps — the first published arrival, which the counter plus
today's date already discloses. `.github/workflows/refresh-travel.yml` rebuilds
nightly so "here now" cannot drift far, and the `ignore` rule in `netlify.toml`
exempts build-hook runs, which change no files and would otherwise be cancelled.

When the current stop is tentative, or the journey is between stops, the page
says "last seen in *place*" — it must never fall through to naming the stop that
comes next. `scripts/verify-travel-build.mjs` asserts no withheld stop name and
no itinerary date appears in the built page or any shipped script;
`scripts/verify-travel-clock.mjs` asserts the day counter still advances under a
moving clock while the published set does not.

Three keyboard-operable tabs show stats, route, or the chronological timeline.
The forward-looking `road-ahead/` tab and its Open-Meteo forecasts were removed
with the privacy split — both existed only to describe stops not yet reached —
so the site-wide CSP no longer needs a `connect-src` grant at all, only the
CARTO tile images. Leaflet is recreated after the route panel becomes visible so
it always receives real dimensions. Route stop controls link to photo rolls
whose effective shoot locations match by normalized place name or an 80 km
proximity threshold.

`admin/src/pages/travel/` is the only surface in the system that renders exact
dates, onward legs or tentative stops: it carries an amber privacy notice, a
full-detail map with both travelled and planned layers, and a dated
`arrive | depart | stop | state` table, all driven by the working draft.

## The photos map

`/photos` renders a dot-matrix world map (`src/components/WorldMap.astro`). The
land mask is a precomputed 240×120 grid in `src/data/world-dots.json` (dots
south of −60° lat are dropped — Antarctica's ice reads as ocean to the mask);
shoot locations are projected equirectangularly as pins. A small client script
cross-highlights each pin with its roll row on hover and lifts the hovered pin
above its neighbours so the tooltip is not clipped.

Pins are aggregated by **primary region**: `src/data/locations.ts` exports
`aggregatePins(rolls)`, which groups every roll's effective locations by
`region.name` (falling back to the place name), yielding one pin per country
positioned at the region, with the member cities listed in the tooltip. Counts
sum across the group. `effectiveLocations(roll)` still drives the per-roll `+N`
label on `RollRow`.
