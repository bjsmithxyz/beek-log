# bjsmith.xyz

A portfolio website built with **Astro 5**. This project showcases development work, art, and photography with a focus on clean aesthetics and smooth user experience.

## Project Structure

```text
/
├── public/          # Static assets (favicons, robots.txt, og-image)
├── scripts/         # Maintenance scripts (image compression, roll import, …)
├── src/
│   ├── assets/
│   │   ├── images/  # Images for work entries
│   │   └── photos/  # Film scans, one folder per roll
│   ├── components/  # Reusable Astro components
│   ├── content/     # Content collections (Markdown files)
│   │   ├── work/    # Individual project/art entries
│   │   └── photos/  # One file per film roll
│   ├── data/        # film-stocks.ts, world-dots.json (map land mask)
│   ├── layouts/     # Page layouts (BaseLayout.astro)
│   ├── pages/       # Route components (index, work, photos, about)
│   └── styles/      # Global CSS and design tokens
├── astro.config.mjs # Astro configuration (Netlify adapter, sitemap)
├── netlify.toml     # Headers (CSP etc.), caching, build settings
└── package.json     # Project dependencies and scripts
```

## Development

### Local Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```sh
   npm install
   ```
3. **Start the development server**:
   ```sh
   npm run dev
   ```
   The site will be available at `http://localhost:4321`.

Entries with `draft: true` render in the dev server but are excluded from
production builds, RSS, and the sitemap.

### Content Management

New content can be added by creating a new `.md` file in `src/content/work/`. 

Example frontmatter:
```markdown
---
title: "Project Name"
description: "Brief description of the work."
date: 2024-02-01
category: "dev" # or "art", "photography"
featured: true
cover: "./path-to-image.jpg"
tags: ["Astro", "TypeScript"]
liveUrl: "https://example.com"
---
```

### Adding a Roll of Film

Photography lives at `/photos` as one page per developed roll, rendered as a
contact sheet (negative strips with film-edge markings). Shoot locations are
pinned on the dot-matrix world map on the photos index.

1. **Import the scans** (resizes to ≤2048px JPEG q80, strips GPS metadata,
   numbers frames `001.jpg`, `002.jpg`, …):

   ```sh
   node scripts/import-roll.mjs <roll-slug> <path-to-scans>
   # e.g. node scripts/import-roll.mjs 2026-06-gold-200-lisbon ~/scans/lisbon
   ```

   Slug convention: `YYYY-MM-<stock>-<place>`. The script prints a ready-made
   frontmatter skeleton when it finishes.

2. **Create the roll file** at `src/content/photos/<roll-slug>.md`:

   ```markdown
   ---
   title: lisbon in june
   stock: kodak-gold-200        # slug from src/data/film-stocks.ts
   date: 2026-06-02
   location:
     name: Lisbon, Portugal
     lat: 38.7223
     lng: -9.1393
   photos:
     - src: ../../assets/photos/2026-06-gold-200-lisbon/001.jpg
       alt: tram 28 climbing alfama
     - src: ../../assets/photos/2026-06-gold-200-lisbon/002.jpg
       alt: miradouro at dusk
       caption: optional nicer caption for the lightbox
   ---

   Optional roll notes — camera, what went wrong, what went right.
   ```

3. **Shooting a new film stock?** Add it to `src/data/film-stocks.ts` first.
   The `type` field (`color` | `bw`) sets the edge-marking colour on the
   contact sheet: orange for colour negative, grey for B&W rebate.

The map pin is placed from `location.lat`/`lng` (equirectangular projection),
and clicking it jumps to that roll in the list. Set `draft: true` while a
roll is work-in-progress.

### Images

- Sources are committed pre-compressed; run `node scripts/compress-images.mjs`
  after adding large work images (resizes to ≤2048px and palette-quantizes
  PNGs in place).
- In production, `astro:assets` images are served through the **Netlify Image
  CDN** (`/.netlify/images?…`) — resizing and format conversion happen
  on-demand at the edge, so builds stay fast and originals stay small.
- `scripts/generate-world-dots.mjs` regenerates the world-map land mask from
  any equirectangular world image; `scripts/generate-og-image.mjs` regenerates
  the social-share card.

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build your production site to `./dist/` |
| `npm run preview` | Preview your build locally |
| `npm run astro ...` | Run Astro CLI commands |
| `node scripts/import-roll.mjs <slug> <dir>` | Import a developed film roll |
| `node scripts/compress-images.mjs [dir]` | Compress source images in place |

## Deployment

This project is configured for deployment on **Netlify**. Any push to the `main` branch will automatically trigger a build and deploy.

Security headers (CSP, HSTS, Permissions-Policy) and immutable caching for
hashed `/_assets/*` are set in `netlify.toml`. Don't add a `/* -> /404.html`
redirect there — Netlify serves `404.html` automatically, and the explicit
rule breaks dev-server routing under the Netlify adapter.
