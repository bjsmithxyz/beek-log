# Photography

`/photos` is the film-photography section: one page per developed roll, each
rendered as a contact sheet of negative strips (sprocket holes, film-edge
markings, frame numbers), with a dot-matrix world map of shoot locations on the
index. Click any frame for a full-screen lightbox showing the film stock, frame
number, date, and that frame's location.

Rolls are managed through a **local, dev-only admin app**. It is a standalone
Node server started with `npm run admin` — it is *not* part of the Astro build,
so it never deploys and has no production surface area.

```sh
npm run admin   # opens http://127.0.0.1:4322
```

## Create a roll

1. Name your scans folder `YYYY-MM-DD - <film-stock-slug>-<ISO>`, e.g.
   `2026-06-02 - kodak-portra-400-PT`. The admin derives the date, film stock,
   and country from the name; anything that doesn't match is left for manual
   entry.
2. Paste the folder path and **scan** — thumbnails appear.
3. **Drag** thumbnails to set frame order; edit each frame's alt text and
   optional caption.
4. Search the **primary location** to fill latitude/longitude (or type them).
5. **Per-photo location:** if a roll spans places (e.g. China then Hong Kong),
   set a frame's location — it fills forward to the following frames until the
   next explicit change, or multi-select frames and bulk-assign. Each distinct
   location becomes its own map pin.
6. **Write + commit + push** to publish (Netlify deploys on push), or **write
   roll** to only write the files and commit yourself.

## Edit a roll

Pick a roll from the edit dropdown — its frames and metadata load. Reorder,
relabel, add frames (scan another folder), remove frames, or change locations,
then publish again. Frame files are rebuilt and renumbered atomically, so
reordering never corrupts the set.

## Film stocks

Stocks live in `src/data/film-stocks.ts`, keyed by slug. Each has a display
`name` (kept verbatim, including non-Latin names) and a `type` — `color` or
`bw` — which sets the contact-sheet edge-marking colour (orange for colour
negative, grey for B&W rebate). Add a new stock here before importing a roll
shot on it.

## What a roll looks like on disk

The admin writes:

- `src/content/photos/<slug>.md` — frontmatter (title, stock, date, location,
  optional per-photo locations) plus an optional markdown body for roll notes.
- `src/assets/photos/<slug>/001.jpg, 002.jpg, …` — frames resized to ≤2048px,
  JPEG quality 80, numbered in display order.

Slugs must match `^[a-z0-9-]+$` (they become directory names and URLs). The
admin transliterates Cyrillic and strips accents/punctuation when generating or
sanitising a slug, so non-Latin place names still produce a valid slug.
