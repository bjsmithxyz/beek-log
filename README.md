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

### Adding or Editing a Roll of Film

Photography lives at `/photos` as one page per developed roll, rendered as a
contact sheet. Rolls are managed through a local, dev-only admin app — it never
deploys (it is not part of the Astro build).

```sh
npm run admin   # opens http://127.0.0.1:4322
```

**Create a roll:**

1. Name your scans folder `YYYY-MM-DD - <film-stock-slug>-<ISO>` (e.g.
   `2026-06-02 - kodak-portra-400-PT`). The admin derives the date, film stock,
   and country from it; anything that doesn't match is left for manual entry.
2. Paste the folder path and **scan** — thumbnails appear.
3. **Drag** thumbnails to set frame order; edit each frame's alt/caption.
4. Search the **primary location** to fill lat/lng (or type them).
5. **Per-photo location:** if a roll spans places (e.g. China then Hong Kong),
   set a frame's location — it fills forward to following frames until the next
   change; or multi-select frames and bulk-assign. Each location becomes its own
   map pin.
6. **Write + commit + push** to publish (Netlify deploys on push), or **write
   roll** to only write files and commit yourself.

**Edit a roll:** pick it from the edit dropdown — frames and metadata load;
reorder, relabel, add frames (scan another folder), remove frames, or change
locations, then publish again.

**New film stock?** Add it to `src/data/film-stocks.ts` first (its `type`,
`color` or `bw`, sets the contact-sheet edge-marking colour).

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
| `npm run admin` | Local roll-import admin at `127.0.0.1:4322` (create/edit rolls) |
| `npm test` | Run the unit test suite |
| `node scripts/compress-images.mjs [dir]` | Compress source images in place |

## Deployment

This project is configured for deployment on **Netlify**. Any push to the `main` branch will automatically trigger a build and deploy.

Security headers (CSP, HSTS, Permissions-Policy) and immutable caching for
hashed `/_assets/*` are set in `netlify.toml`. Don't add a `/* -> /404.html`
redirect there — Netlify serves `404.html` automatically, and the explicit
rule breaks dev-server routing under the Netlify adapter.
