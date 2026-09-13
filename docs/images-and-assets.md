# Images & assets

## Source images

Committed **pre-compressed**. After adding large work images:

```sh
node scripts/compress-images.mjs [dir]   # default: src/assets/images
```

Resizes anything over 2048px on the long edge and palette-quantizes PNGs in
place (~quality 80), overwriting only when smaller. Film scans are compressed at
import time by the roll admin instead (see [photography.md](photography.md)).

## Netlify Image CDN

In production, `astro:assets` `<Image>` emits `/.netlify/images?…` URLs; the
adapter routes resizing and format conversion to the edge, on demand and cached,
so builds stay fast and originals stay small. `npm run dev` falls back to Sharp.
Image-heavy grids (contact-sheet frames, the highlights grid, roll previews) pass
`widths`/`sizes` so the CDN emits a `srcset` — crisp on Retina, lighter on phones.

## Generated assets

- `node scripts/generate-og-image.mjs` — regenerates `public/og-image.png`, the
  1200×630 social card.
- `npm run climate` (`scripts/fetch-climate.mjs`) — tops up
  `src/data/climate.json`, the ten-year monthly normals the travel page bakes in.
  Incremental/resumable; `--force` refetches everything.

## Favicons

- `public/favicon.svg` / `.ico` — the site favicon.
- `admin/public/favicon.svg` — the distinct camera icon for the admin.
