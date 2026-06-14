# Images & assets

## Source images

Source images are committed **pre-compressed**. After adding large work images,
run:

```sh
node scripts/compress-images.mjs [dir]   # default: src/assets/images
```

It resizes anything over 2048px on the long edge and palette-quantizes PNGs in
place (lossy, ~quality 80), overwriting only when the result is smaller. Film
scans are compressed at import time by the roll admin instead (see
[photography.md](photography.md)).

## Netlify Image CDN

In production, `astro:assets` `<Image>` emits `/.netlify/images?…` URLs. The
Netlify adapter (`astro.config.mjs`) routes resizing and format conversion to
the edge, on demand and cached — so builds don't spend minutes transforming
images and the deployed originals stay small. Local `npm run dev` falls back to
Sharp.

## Generated assets

- `node scripts/generate-world-dots.mjs <equirectangular-image>` — regenerates
  `src/data/world-dots.json`, the 120×60 land mask behind the photos map. Prints
  an ASCII preview so you can eyeball the continents before committing.
- `node scripts/generate-og-image.mjs` — regenerates `public/og-image.png`, the
  1200×630 social-share card, in the site's terminal aesthetic.

## Favicons

- `public/favicon.svg` / `public/favicon.ico` — the site favicon.
- `scripts/admin/favicon.svg` — a distinct camera icon for the roll-admin tab,
  served by the admin server only.
