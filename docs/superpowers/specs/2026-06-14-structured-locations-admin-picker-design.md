# Structured locations + admin location picker

**Date:** 2026-06-14
**Status:** Approved (design)

## Problem

Two coupled problems with how shoot locations work:

1. **Admin entry is clunky.** In `scripts/admin/`, setting a frame or bulk
   location uses native `prompt()` dialogs — type a place name, then type a
   *number* to disambiguate geocoder results. The roll's primary location has a
   nicer clickable list, so the UI is inconsistent. There is no map to confirm
   where the pin lands, and a place already used on the roll must be re-searched
   every time.

2. **The site map shows overlapping tooltips.** `/photos` builds one pin per
   distinct location *name* (`effectiveLocations` → `pinMap`). A roll tagged
   "Ha Noi", "Hoi An", "Da Nang" produces three pins that sit almost on top of
   each other at world scale, so hovering the region piles up tooltips. Labels
   are also the raw Nominatim `display_name` ("Hội An, Quảng Nam, Vietnam").

The fix for both is a **primary/secondary** location model: group by a primary
(country) so the map shows one pin per country with a secondary (city)
breakdown, and make the admin capture that structure cheaply.

## Goals

- One pin per primary (country) on the site map, positioned at the primary, with
  a secondary (city) breakdown in the tooltip.
- A single, consistent admin location picker (search + interactive map +
  reusable chips) used for the roll primary, per-frame, and bulk assignment.
- Auto-derive the primary (country) and a clean secondary name from one geocoder
  search, so structure costs no extra effort.
- Fully backward compatible: existing rolls keep rendering until updated.

## Non-goals

- Map zoom / pan on the public site (it stays a fixed world view).
- Reverse-geocoding when the admin pin is dragged (drag adjusts coords only;
  the chosen name persists as a label).
- A third location tier. Exactly two levels: place + optional region.

## Decisions (from brainstorming)

- Admin picker: **Option A** — one shared overlay picker (search → clickable
  results, Leaflet map with a draggable pin, chips of the roll's known
  locations, editable coords fallback).
- Map/pin: **Leaflet + OSM tiles** (CDN), interactive, drag-to-adjust.
- Location model: **flat place + optional `region`** (backward compatible).
- Propagation: **keep auto fill-forward** (setting one frame cascades to
  following non-explicit frames; unassigned frames inherit the roll primary).

## Data model

`src/content.config.ts` — factor the point shape out and add an optional
`region` to the location schema (used by both the roll `location` and each
photo's `location` override):

```ts
const pointSchema = z.object({
  name: z.string(),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const locationSchema = pointSchema.extend({
  region: pointSchema.optional(), // primary (country); the rest is the place
});
```

`region` optional ⇒ existing frontmatter validates unchanged and renders as it
does today (a standalone pin keyed by its place name).

`src/data/locations.ts`:

```ts
export interface Point { name: string; lat: number; lng: number; }
export interface Location extends Point { region?: Point; }
export type CountedLocation = Location & { count: number };
```

`effectiveLocations(roll)` keeps de-duplicating a roll's photos by place name
(case-insensitive) and now carries `region` through on each `CountedLocation`.

## Site map grouping

New pure helper in `src/data/locations.ts`, e.g. `aggregatePins(rolls)`, used by
`src/pages/photos/index.astro` in place of the inline `pinMap` loop:

- Group across all rolls by **`region?.name ?? name`** (lowercased key).
- Per group / pin:
  - `label` = `region.name` if present, else the place name.
  - `lat`/`lng` = `region` coords if present, else the place coords.
  - `count` = sum of member frame counts.
  - `members` = distinct secondary `{ name, count }` within the group.
  - `slug` = most recent roll with a photo in the group (rolls are
    date-descending; first encountered wins — unchanged from today).

`src/components/WorldMap.astro` tooltip becomes two lines:

- Line 1: `${label} — ${count} ${count === 1 ? 'frame' : 'frames'}` (existing
  style).
- Line 2 (muted, smaller): member names joined by ` · `, rendered only when the
  group has more than one distinct secondary (or any secondary distinct from the
  label). Implemented with `<tspan>` rows; tooltip box width = widest line,
  height grows for the second line. Edge-clamping, hover/lift, and pin↔row
  cross-highlight (by `slug`) are unchanged.

Cross-highlight note: a grouped pin links to one representative roll, so for a
country spanning multiple rolls only that roll's row cross-highlights. This is
the same behaviour as today (pins already collapse across rolls) — no
regression; out of scope to improve here.

## Admin picker (`scripts/admin/`)

A single overlay picker replaces every `prompt()`/`alert()` location path.

Interface (in `app.js`):

```js
openLocationPicker({ initial, known }) // → Promise<Location | null>
```

- `initial`: the current `Location` (or null) to seed fields/marker.
- `known`: deduped `Location[]` already on the roll (primary + frame locations
  and their regions) for the reuse chips.

Picker contents (built once, reused):

- **Search** input + button, Enter to submit → clickable results list (reuse the
  `.geo-results` style). No numbered `prompt()`.
- **Leaflet map** with one draggable marker. Clicking a result or chip recenters
  and drops the pin; dragging the marker fine-tunes lat/lng (name + region
  persist). Subtle CSS `filter` (grayscale) on the tile layer to suit the dark
  theme.
- **Chips** of `known` locations for one-click reuse.
- **Editable coords + names** (place name, lat, lng, region name) as the
  precision / offline fallback.
- **OK / Cancel.** OK resolves with the assembled `Location`.

Graceful degradation: if Leaflet or tiles fail to load (`window.L` absent), the
picker still works via the results list, chips, and manual fields.

Wiring:

- **Roll metadata**: the `loc-search` / results / manual lat-lng block becomes a
  primary-location summary (place + region) with an `[edit]` button → picker.
  Slug still derives from the place name.
- **Frame card**: `📍 <name> [change ▾]` → picker (seeded with current +
  chips). Setting a single frame still **fills forward** to following
  non-explicit frames.
- **Bulk**: `set location for selected ☑` → picker, applied to checked frames.

All three call the one `openLocationPicker`.

## Server (`scripts/admin/server.mjs`)

- `/api/geocode`: add `&addressdetails=1`. Map each result to
  `{ name, lat, lng, region: { name, lat, lng } }` where:
  - `name` = `address.city || town || village || hamlet || state` (fallback:
    first comma-part of `display_name`) — a clean secondary label.
  - `region.name` = `address.country`.
  - `region` coords = the country's representative point, resolved by geocoding
    the country name once, **memoised in-process** (a country lookup map) to
    respect Nominatim rate limits. If the country can't be resolved, omit
    `region` and let the place stand alone.
- Add a static route serving `scripts/admin/loc-utils.mjs` to the browser.
- `/api/publish` validation: if a `region` is present on the roll or any frame
  location, validate it the same way (name + finite lat/lng).
- Leaflet JS/CSS and OSM tiles load from CDN in `index.html` (the admin already
  requires network for Nominatim; it is dev-only and never deployed).

The frontmatter writer (`scripts/admin/publish.mjs` / `lib.mjs`) must serialize
the optional nested `region` for the roll location and per-frame overrides.

## Pure logic + tests

- `scripts/admin/loc-utils.mjs` (new, browser- and node-importable):
  - `dedupeByName(locations)` — case-insensitive de-dup preserving order.
  - `mergeLocation(list, loc)` — add/replace in the known list.
  - `fillForward(frames, fromIndex, loc)` — apply to a frame and following
    non-explicit frames (extracts current behaviour).
  - `knownLocations(rollPrimary, frames)` — build the deduped chip list.
- `scripts/admin/loc-utils.test.mjs` (new) — `node --test`, mirroring
  `lib.test.mjs`.
- `src/data/locations.test.mjs` — add cases for `region` carried through
  `effectiveLocations` and for `aggregatePins` grouping (one pin per region,
  summed counts, member breakdown, fallback when no region).

The Leaflet/DOM UI itself is verified manually with `npm run admin`.

## Migration of existing rolls

`scripts/migrate-locations.mjs` (new, run-once, dry-run by default):

- For each `src/content/photos/*.md`, for the roll `location` and each photo
  `location` that lacks `region`:
  - `parts = name.split(',').map(trim)`.
  - secondary `name` = `parts[0]`; `region.name` = `parts[parts.length - 1]`
    (country).
  - `region` coords via a cached country geocode.
  - keep the existing place lat/lng.
- Print an old→new diff per location; only write with an explicit `--write`
  flag (matches the eyeball pattern of `generate-world-dots.mjs`).

Alternative for the 5 current rolls: re-edit them in the admin — edit mode loads
frames from the committed repo, so no source folder is needed. The script is the
default because it is deterministic and reviewable.

## Docs

- `docs/architecture.md`: location model (place + optional region) and the
  one-pin-per-region map grouping; mention the admin picker.
- `docs/photography.md`: the `region` field and the picker-based location
  workflow.

## Error handling

- Geocode failure / no results → inline message in the picker (never `alert()`),
  with manual coords still available.
- Country geocode failure → location saved without `region` (standalone pin).
- Leaflet/tiles unavailable → picker degrades to list + manual fields.
- Publish validation rejects malformed `region` (name + numeric lat/lng).

## File-by-file change list

| File | Change |
| --- | --- |
| `src/content.config.ts` | `pointSchema`; `locationSchema` gains optional `region` |
| `src/data/locations.ts` | `Point`/`Location`/`CountedLocation`; carry `region`; `aggregatePins` |
| `src/data/locations.test.mjs` | tests for region + `aggregatePins` |
| `src/pages/photos/index.astro` | use `aggregatePins` for pins |
| `src/components/WorldMap.astro` | two-line tooltip (label + member breakdown) |
| `scripts/admin/index.html` | Leaflet CDN; picker overlay markup; roll/frame UI |
| `scripts/admin/app.js` | `openLocationPicker`; wire roll/frame/bulk; remove prompts |
| `scripts/admin/server.mjs` | geocode `addressdetails` + region coords (cached); serve `loc-utils.mjs`; validate region |
| `scripts/admin/publish.mjs` / `lib.mjs` | serialize nested `region` |
| `scripts/admin/loc-utils.mjs` | pure helpers (new) |
| `scripts/admin/loc-utils.test.mjs` | helper tests (new) |
| `scripts/migrate-locations.mjs` | one-time region backfill (new) |
| `docs/architecture.md`, `docs/photography.md` | document the model + picker |

## Verification

- `npm run build` clean; `npm test` green (existing + new helper/grouping
  tests).
- Site map: one pin per country, two-line tooltip, hover/cross-highlight intact;
  existing un-migrated rolls still render.
- `npm run admin`: picker search → map pin → chip reuse → frame/bulk assign →
  write; round-trips region through publish and re-edit.
