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
4. Set the **primary location** with the picker — search a place and pick a
   result, drag the pin on the map to fine-tune, or click a chip to reuse a
   location already on the roll. The place's country is captured as its
   `region` automatically (in English).
5. **Per-photo location:** if a roll spans places (e.g. Chiang Mai then
   Hanoi), set a frame's location — it fills forward to the following frames
   until the next explicit change, or select frames (or **select all**) and
   bulk-assign with the same picker. Pins are grouped by country on the map.
6. **Write + commit + push** to publish (Netlify deploys on push), or **write
   roll** to only write the files and commit yourself. The console below logs
   progress — errors in red, a green line on success.

A GitHub-auth badge sits in the bottom-right corner. It checks `gh` on load
(click it to re-check) and the **write + commit + push** button stays disabled
unless `gh` holds a valid github.com token — run `gh auth login` if it shows red.
The server enforces the same check before committing, so a failed push can't
leave an unpushed commit behind. **Write roll** is never blocked.

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

Locations carry an optional `region` (country) alongside the specific place, so
the map shows one pin per country with a city breakdown. The roll-import admin
(`npm run admin`) fills both from one search — its location picker (search +
interactive map + reusable chips of the roll's known locations) replaces typing,
and the chosen place's country becomes the `region` automatically. Drag the map
pin to fine-tune coordinates. Older rolls created before this keep working
(`region` is optional); re-open one in the admin and re-pick its locations to
add regions.

Slugs must match `^[a-z0-9-]+$` (they become directory names and URLs) and are
derived from the date, stock, and place — the primary location, or the first
frame's location if no primary is set. The admin transliterates Cyrillic and
strips accents/punctuation, so non-Latin place names still produce a valid slug.

Each roll needs a **unique** slug. The admin refuses a write whose slug already
belongs to a different roll, so one roll can never overwrite another — give a
colliding roll a distinct slug (e.g. add the city) before writing.
