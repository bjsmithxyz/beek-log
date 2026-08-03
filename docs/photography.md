# Photography

`/photos` is the film-photography section: one page per developed roll, each
rendered as a contact sheet of negative strips (sprocket holes, film-edge
markings, frame numbers), with a dot-matrix world map of shoot locations on the
index. Click any frame for a full-screen lightbox showing the film stock, frame
number, date, and that frame's location.

Rolls are managed at `https://admin.bjsmith.xyz/rolls/`. The uploader requires
the authenticated owner and a current desktop browser with a native folder
picker (File System Access or a directory-input fallback), Workers, WebAssembly,
`createImageBitmap`, and `OffscreenCanvas`. Unsupported/mobile browsers fail
closed and link to the travel editor.

## Create a roll

1. Choose a scan folder named `YYYY-MM-DD - <film-stock-slug>-<ISO>`.
2. The browser applies orientation, resizes to a 2048px long edge, and encodes
   quality-80 MozJPEG-family JPEGs in two bounded workers. Originals never leave
   the device.
3. Order frames, add optional alt/captions, and use the location search/map/chips
   for primary and per-frame locations. Country is retained as `region`.
4. Review the operation. New encoded images upload as unreferenced Git blobs;
   no repository path or production content changes yet.
5. The server creates one atomic branch commit and pull request. Review the
   public Deploy Preview, then merge or abandon separately from the admin.

## Edit or delete a roll

Load an existing roll from the admin list to reorder, relabel, add/remove frames,
change locations, rename, or delete it. Existing frame blobs are reused
losslessly. Stale SHA and complete-inventory checks prevent overwriting newer
content or leaving orphaned numbered frames. Every operation follows the same
branch → PR → Deploy Preview → explicit merge flow.

## Film stocks

Stocks live in `shared/film-stocks.ts`, keyed by slug. Each has a display
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
the map shows one pin per country with a city breakdown. The hosted admin fills
both from one search; its location picker combines search, an interactive map,
and reusable chips of the roll's known locations. The chosen place's country
becomes the `region` automatically. Drag the map pin to fine-tune coordinates.
Older rolls created before this keep working
(`region` is optional); re-open one in the admin and re-pick its locations to
add regions.

Slugs must match `^[a-z0-9-]+$` (they become directory names and URLs) and are
derived from the date, stock, and place — the primary location, or the first
frame's location if no primary is set. The admin transliterates Cyrillic and
strips accents/punctuation, so non-Latin place names still produce a valid slug.

Each roll needs a **unique** slug. The admin refuses a write whose slug already
belongs to a different roll, so one roll can never overwrite another — give a
colliding roll a distinct slug (e.g. add the city) before writing.
