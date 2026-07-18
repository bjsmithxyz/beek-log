# Architecture

## Stack

- **[Astro 6](https://astro.build)** — static-first site generator. Every page
  is prerendered to HTML at build time.
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

## Project structure

```text
/
├── public/          # Static assets (favicons, robots.txt, og-image)
├── scripts/         # Maintenance + the roll-import admin (see photography.md)
├── docs/            # This documentation
├── src/
│   ├── assets/
│   │   ├── images/  # Images for work entries
│   │   └── photos/  # Film scans, one folder per roll
│   ├── components/  # Reusable Astro components
│   ├── content/
│   │   ├── work/    # One markdown file per project/art entry
│   │   └── photos/  # One markdown file per film roll
│   ├── data/        # film-stocks.ts, world-dots.json, locations.ts
│   ├── layouts/     # BaseLayout.astro
│   ├── pages/       # Routes: index, work, photos, about, rss.xml, 404
│   └── styles/      # global.css (design tokens)
├── astro.config.mjs # Netlify adapter + sitemap
├── netlify.toml     # Headers, caching, build settings
└── package.json
```

## Content collections

Defined in `src/content.config.ts` with Zod schemas. Both collections use the
Content Layer `glob()` loader; entries are keyed by `id` (the filename slug) and
rendered with `render(entry)` from `astro:content`.

**`work`** — dev / art / photography entries. Fields: `title`, `description`,
`date`, `category` (`dev` | `art` | `photography`), `tags`,
`draft`, optional `liveUrl` / `repoUrl`, optional `cover` image, optional
`images` gallery.

**`photos`** — one entry per developed film roll. Fields: `title`, `stock`
(a slug validated against `src/data/film-stocks.ts`), `date`, roll-level
`location` (`{ name, lat, lng }`), `draft`, and `photos[]` where each frame has
`src`, `alt`, optional `caption`, and an optional per-photo `location` override.
See [photography.md](photography.md).

Each `location` is `{ name, lat, lng }` with an optional `region` (the primary,
e.g. a country) of the same shape — the place is the secondary. `region` is
optional and backward compatible.

Entries with `draft: true` render in the dev server but are excluded from
production builds, RSS, and the sitemap.

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
