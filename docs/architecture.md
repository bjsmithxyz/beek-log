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

The admin dashboard (`admin/src/components/AdminTree.astro`) is the same
component pattern, but its `rolls/` branch is populated live rather than at
build time: a client script fetches `/.netlify/functions/rolls-data` and
`/.netlify/functions/travel-data` on load, grouping rolls into newest-first
year subsections (`admin/src/lib/roll-tree.mjs`, unit tested on its own) and
setting the `rolls/` and `travel/` leaf counts from the currently-committed
data. Every leaf still links to its real page (`/rolls/<slug>/`, `/travel/`)
rather than editing inline — only the *listing* is live, not the editors
themselves. A fetch failure degrades each meta label to "offline" rather than
blocking the rest of the tree.

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
│   ├── data/        # trips.json, locations.ts, site.ts
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
one Git tree and commit, and fast-forwards `refs/heads/main`. After a successful
content commit it best-effort POSTs the public Netlify build hook
(`NETLIFY_BUILD_HOOK`) so `bjsmith.xyz` rebuilds promptly. It does not open
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

**The public page publishes places, never a schedule.** Exact dates, notes and
tentative flags are withheld. Visited stops ship as history; future stops ship
as a dateless `planned` route on the `route/` tab. This is enforced where it
cannot be worked around: `shared/trip-public.mjs` reduces the itinerary at build
time and only that result is embedded in the page, so `trips.json` never enters
the client bundle at all. Filtering in the browser would not do — the full
itinerary would still ship to anyone who opened the JavaScript.

The cost is that past/current status is decided at build time rather than by the
browser. That is a deliberate reversal of the earlier design: computing status
client-side requires giving the client every stop's dates, which is precisely
what may not be published. Only the day counter stays live, derived from the one
date the payload keeps — the first published arrival, which the counter plus
today's date already discloses. `.github/workflows/refresh-travel.yml` rebuilds
on public-path pushes to `main` and nightly so "here now" cannot drift far; the
public `ignore` rule always builds so those hooks (and ordinary pushes) are
never skipped.

When the current stop is tentative, or the journey is between stops, the page
says "last seen in *place*" — it must never fall through to naming the stop that
comes next. `scripts/verify-travel-build.mjs` asserts no withheld stop name and
no itinerary date appears in the built page or any shipped script;
`scripts/verify-travel-clock.mjs` asserts the day counter still advances under a
moving clock while the published set does not.

Three keyboard-operable tabs show stats, route, or the chronological timeline.
The forward-looking `road-ahead/` tab stayed gone with the privacy split — it
existed to date and forecast stops not yet reached — and with it went the live
Open-Meteo forecasts, so the site-wide CSP needs no `connect-src` grant at all,
only the CARTO tile images. The planned route itself came back on `route/` as a
dashed amber layer and place chips: names and coordinates, no dates. Leaflet is
recreated after the route panel becomes visible so it always receives real
dimensions. Route stop controls link to photo rolls whose effective shoot
locations match by normalized place name or an 80 km proximity threshold.

**Weather came back without the network.** What a place is typically like in a
given calendar month follows from the place and the month alone — both of which
the payload already publishes — so it discloses nothing the split withheld.
`scripts/fetch-climate.mjs` resolves ten-year monthly normals from Open-Meteo's
ERA5 archive into `src/data/climate.json` (keyed by tenth-of-a-degree point, so
the key is no finer than the reanalysis grid); `shared/trip-climate.mjs` looks
them up and `shared/trip-public.mjs` joins the matching one onto each published
stop. The browser therefore renders typical highs, lows, rainfall and daylight
while still making no requests — `verify-travel-clock.mjs` proves it by running
the page with a `fetch` that throws. Regenerate with `npm run climate` after
adding stops; a stop with no normal simply renders without weather, and
`verify-travel-build.mjs` warns rather than fails, so an admin publish is never
blocked by a stale cache.

`admin/src/pages/travel/` is the only surface in the system that renders exact
dates, notes or tentative flags: an amber privacy notice sits above the plain
stop-editing list, all driven by the working draft. It no longer carries a
full-itinerary map/table overview (`admin/src/scripts/travel-overview.js`
was removed) — that duplicated the per-stop editor's own information with a
second Leaflet instance for no real benefit at this project's scale.

## Photo curation: selects and highlights

Each photo in a roll's frontmatter carries an optional `featured: boolean`
(default `false`), set per-frame in the hosted admin's roll editor (★ button
on each frame card). A roll with at least one featured frame renders a
curated **selects** grid by default on `/photos/<roll>/`, with the full
frame-by-frame contact sheet demoted to a collapsed `<details>` disclosure
("full roll — N frames"); a roll with no featured frames renders the full
contact sheet directly, unchanged from before curation existed. `/photos/
highlights/` aggregates every featured frame across every roll into one grid,
independent of roll structure — each tile links to `/photos/<roll>/#frame-N`,
which the roll page's `Lightbox` opens directly via its hash-deep-link
support. `highlights` is a reserved roll slug (`shared/roll-markdown.mjs`)
so a roll can never shadow that route.

The public `/photos/` index carries no archive statistics — that block (roll
count, frame count, per-stock and per-year breakdowns) was cut for being too
busy for a public page, along with the dot-matrix world map that used to sit
above it (it duplicated `/travel/`'s real route map without adding anything).
The equivalent numbers (rolls, frames, distinct stocks, selects) now live as a
one-line summary at the top of the admin's `/rolls/` — computed from every
committed roll's frontmatter, for the owner's own tracking, never shown
publicly. `src/data/locations.ts` no longer exports `aggregatePins`, which
only ever backed the removed map/stats; `effectiveLocations(roll)` remains
and still drives the per-roll `+N` label on `RollRow`.
