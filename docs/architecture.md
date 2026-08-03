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
light toggle. Tokens live in `src/styles/global.css`.

Every page places semantic filesystem-style breadcrumb navigation in its shared
sticky top toolbar. The public theme control uses the same icon treatment as the
social links and sits at the footer's bottom-right, immediately above the
copyright. Keeping the path in each workspace's layout gives every route the
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
rather than a preface to duplicate recent-content listings. Public section
routes share `PageHeader` and one page-title size token; detail
headings and the isolated admin title token resolve to that same size. Admin
typography otherwise uses the same xs/sm/base/display scale as the public site
while retaining its isolated dark-only token names.

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
update and delete operations, verifies expected blob SHAs against `main`, and
builds one Git tree and commit on a unique `admin/<resource>/<request-id>`
branch. It then opens a marked pull request. It never updates `main` directly.

The browser polls the deterministic public Netlify Deploy Preview URL. Merge is
a separate authenticated action that revalidates the PR marker, repository,
base branch, head SHA, mergeability and preview availability. Abandon closes the
PR and removes its branch. Phase 3's travel editor is restricted to
`src/data/trips.json`. Phase 4 extends server path policy only to numbered film
roll assets and Markdown; the browser still cannot choose an arbitrary path.

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
current inventory, and commits all image and Markdown changes atomically through
the generic PR publisher.

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
trip validator runs in tests and during the build. Date-derived values — day
count and past/current/upcoming status — are deliberately computed by the
browser on every load, so they cannot freeze at the last deployment date. Four
keyboard-operable tabs show only stats, route, road-ahead, or the complete
chronological timeline. Leaflet is recreated after the route panel becomes
visible so it always receives real dimensions; only this route's CSP permits
CARTO tile images and Open-Meteo weather requests. Route stop controls link to
photo rolls whose effective shoot locations match by normalized place name or
an 80 km proximity threshold.

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
