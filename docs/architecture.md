# Architecture

## Stack

- **[Astro 5](https://astro.build)** — static-first site generator. Every page
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

Defined in `src/content/config.ts` with Zod schemas.

**`work`** — dev / art / photography entries. Fields: `title`, `description`,
`date`, `category` (`dev` | `art` | `photography`), `tags`, `featured`,
`draft`, optional `liveUrl` / `repoUrl`, optional `cover` image, optional
`images` gallery.

**`photos`** — one entry per developed film roll. Fields: `title`, `stock`
(a slug validated against `src/data/film-stocks.ts`), `date`, roll-level
`location` (`{ name, lat, lng }`), `draft`, and `photos[]` where each frame has
`src`, `alt`, optional `caption`, and an optional per-photo `location` override.
See [photography.md](photography.md).

Entries with `draft: true` render in the dev server but are excluded from
production builds, RSS, and the sitemap.

## The photos map

`/photos` renders a dot-matrix world map (`src/components/WorldMap.astro`). The
land mask is a precomputed 120×60 grid in `src/data/world-dots.json`; shoot
locations are projected equirectangularly as pins.

Pins are aggregated from **per-photo effective locations**, not per roll:
`src/data/locations.ts` exports `effectiveLocations(roll)`, which collapses a
roll's photos to distinct locations (each photo uses its own `location` override
or the roll default) de-duplicated by name. So a roll shot across two countries
shows a pin in each, and a pin's count is the number of frames there. The same
helper drives the `+N` multi-location label on `RollRow`.
