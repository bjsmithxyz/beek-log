# Photography

`/photos` is the film section: one page per developed roll, rendered as a contact
sheet of negative strips (sprocket holes, film-edge markings, frame numbers).
Click any frame for a full-screen lightbox showing film stock, frame number,
date, and location.

## Selects and highlights

Frames can be flagged `featured` per-frame (★ in the admin roll editor). A roll
with ≥1 featured frame shows a curated **selects** grid by default, with the full
contact sheet collapsed behind a "full roll — N frames" disclosure; a roll with
none shows the full sheet directly — curation is opt-in per roll.
`/photos/highlights/` collects every featured frame across the archive into one
grid; each tile links straight into the source roll's lightbox at that frame.
There's no rating scale and no "best roll" flag — the flag lives on the frame.

`/rolls/` in the admin shows a one-line stat summary (rolls, frames, distinct
stocks, selects) from committed frontmatter — a private tracking aid, never
public.

## Managing rolls

Rolls are managed at `https://admin.bjsmith.xyz/rolls/`. The uploader requires
the authenticated owner and a current desktop browser with a native folder
picker (File System Access or directory-input fallback), Workers, WebAssembly,
`createImageBitmap`, and `OffscreenCanvas`. Unsupported/mobile browsers fail
closed and link to the travel editor.

**Create:**

1. Choose a scan folder named `YYYY-MM-DD - <film-stock-slug>-<ISO>`.
2. The browser applies orientation, resizes to a 2048px long edge, and encodes
   quality-80 MozJPEG-family JPEGs in two bounded workers. Originals never leave
   the device.
3. Order frames, add optional alt/captions, and set primary + per-frame locations
   via the search/map/chips picker (country is retained as `region`).
4. Review. Encoded images upload as unreferenced Git blobs; nothing in the repo
   path or production changes yet.
5. The server creates one atomic commit on `main`; Netlify rebuilds production.

**Edit or delete:** load a roll from the admin list to reorder, relabel,
add/remove frames, change locations, rename, or delete. Existing frame blobs are
reused losslessly. Stale-SHA and complete-inventory checks prevent overwriting
newer content or orphaning frames. Every operation commits directly to `main`
through the same publisher.

## Film stocks

Stocks live in `shared/film-stocks.ts`, keyed by slug, each with a display `name`
(verbatim, including non-Latin) and a `type` (`color` | `bw`) that sets the
edge-marking colour (orange for colour negative, grey for B&W rebate). Add a
stock here before importing a roll shot on it.

## On disk

The admin writes:

- `src/content/photos/<slug>.md` — frontmatter (title, stock, date, location,
  optional per-photo locations and `featured` flags) plus optional roll notes.
- `src/assets/photos/<slug>/001.jpg, 002.jpg, …` — frames ≤2048px, JPEG q80,
  numbered in display order.

Locations carry an optional `region` (country) beside the specific place; the
picker fills both from one search and the country becomes `region` automatically
(drag the pin to fine-tune). Older rolls without `region` keep working; re-pick
their locations to add it.

Slugs match `^[a-z0-9-]+$` and derive from date, stock, and place (Cyrillic is
transliterated, accents/punctuation stripped). Each roll needs a **unique** slug;
the admin refuses a write whose slug belongs to another roll, so give a colliding
roll a distinct slug (e.g. add the city).
