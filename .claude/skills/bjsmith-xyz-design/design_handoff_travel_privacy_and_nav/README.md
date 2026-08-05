# Handoff: Travel Privacy, Live Route Map, Location Picker & Nav/Heading Fixes

## Overview
This package documents new behavior designed for **bjsmith.xyz** and **admin.bjsmith.xyz**, prototyped in HTML/React inside a design-system project against the real `bjsmithxyz/beek-log` repo. It covers four changes:

1. A real Leaflet route map on `/travel/`.
2. A public/admin **privacy split** for travel data — dates, forward legs and tentative stops are no longer published publicly.
3. A working **location picker** dialog for the admin roll editor.
4. Small heading/breadcrumb/navigation consistency fixes across the public site.

## About the design files
The `.jsx` files in this bundle are **design references built in a design-system prototyping tool**, not production code to paste in. They use React 18 UMD + Babel-in-browser and a design-system component bundle (`window.<Namespace>.<Component>`) that don't exist in the real site. The real site is server-rendered **Astro** (`.astro` files, no client React framework). Recreate this behavior as Astro components/scripts (or islands, if the repo already uses an island framework for interactive bits like the map) following the repo's existing conventions in `src/components/`, `src/pages/`, `src/scripts/`, and `admin/src/`.

## Fidelity
**High-fidelity for tokens/values, reference-only for markup.** Colors, spacing, type, and the exact copy/labels below are final. Component structure (React function components, prop-drilling, hash routing) is prototype scaffolding — do not copy it; it doesn't map onto Astro's model. Treat this as a spec of *what* should happen and *what it should look like*, not *how the file is organized*.

---

## 1. Live Leaflet route map (`/travel/`)

**Where it lives in the prototype:** `TravelMap.jsx`, mounted from the `route/` tab in `Screens.jsx`, reused (with `detail` prop) in the admin `TravelAdmin` screen.

**Behavior:**
- Leaflet 1.9.4, CARTO basemap tiles — `dark_all` when `data-theme="dark"`, `light_all` when `data-theme="light"` (re-created on theme change).
- Data source: `src/data/trips.json` (`stops[]`: `name`, `country`, `lat`, `lon`, `arrive`, `depart`, optional `note`, optional `tentative`).
- Status per stop, computed **client-side on every load** (never baked in at build time): `past` if `depart < now`, `current` if `arrive <= now <= depart`, else `future`.
- Two polylines: solid for travelled stops (past + current), dashed (`dashArray: '5 6'`) for planned (future) stops — admin only, see privacy section.
- Circle markers: green (`--color-accent-primary`) for past, cyan (`--color-accent-tertiary`) for current (larger radius, weight 3), amber (`--color-accent-secondary`) for future.
- Clicking a stop chip below the map calls `map.flyTo([lat,lon], 6, {duration:0.6})` and opens that marker's popup.
- Popups are square (radius 0), themed via CSS (`--color-bg-secondary` background, `--shadow-hard`), showing place + country only by default (see privacy section for the `detail` variant).
- Map container: `1px solid var(--color-border-strong)`, `var(--shadow-hard)`, min-height 360px, `height: min(62vh, 540px)`.

## 2. Travel privacy split

**Rule:** the public `/travel/` page must never show exact dates, forward itinerary, or tentative stops. Full detail is admin-only.

**Public `/travel/` (`TravelScreen` in `Screens.jsx`):**
- Filter stops to `status !== 'future' && !stop.tentative` **before any rendering** — filtered stops never reach the DOM, not just visually hidden.
- Only three tabs: `stats/`, `route/`, `timeline/`. The `road-ahead/` tab is removed entirely from the public page.
- Map gets `layers={{ travelled: true, planned: false }}` and no `detail` prop → popups show place + country (+ "here now" if current) only, no dates, no day counts.
- Timeline rows show place + country under a year heading — no arrive/depart dates, no day counts.
- The "day N" counter and "in `<place>`" line stay public (counts elapsed days since trip start, not a location leak) — but when the current stop isn't publishable, it must degrade to **"last seen in `<place>`"** rather than showing the next (unpublished) stop.
- Stats tab: total days, "stops so far" (count of publishable stops only), countries (from publishable stops only). No forward-looking copy.
- Copy: page description reads "Places I've been, in order — no dates, no onward plans."

**Admin `travel/` (new screen, `TravelAdmin` in `AdminScreens.jsx`, routed at `#travel` / equivalent `admin/src/pages/travel/`):**
- Shows an amber notice panel: "authenticated view — exact dates, forward plans and tentative stops are never published to bjsmith.xyz."
- Full map: both layers on, `<TravelMap ... detail />` — popups include `arrive → depart` and day count, plus `note` and "tentative" flag when present.
- A dated table below the map: columns `arrive | depart | stop | state`, where state is `done` / `here now` / `planned` / `tentative`.
- This is the *only* surface in the whole system that renders exact travel dates or upcoming/tentative stops.

**Component change:** `TravelMap` takes a new boolean prop `detail` (default `false`). When true, popups append the dated line and notes; when false (public default), popups are place + country only.

## 3. Location picker (admin roll editor)

**Where it lives in the prototype:** `LocationPicker.jsx`, opened from "set location" (roll-level) and "set selected location" (per-frame) in `RollEditor` (`AdminScreens.jsx`).

**Behavior:**
- Modal dialog: search input + "search" button, a result list (up to 6 matches), a row of "recent" chips, a live Leaflet map (click anywhere to drop a pin), and four editable fields: place name, latitude, longitude, region/country.
- Search matches against a local gazetteer built from `trips.json`'s own stops (name + country substring match). **Recommendation for the real app:** keep the existing geocoding API call the admin already uses (this was a prototype-only substitution to avoid a live API key) — do not port the local-gazetteer approach into production; it was a stand-in, not a design decision.
- Clicking a search result or a recent chip fills the fields and flies the map to that point.
- Clicking the map drops/moves a green circle marker and fills lat/lng (leaves name/region for the user to fill in — shows a message "Pin dropped — name it before saving.").
- "use location" button returns `{name, region, lat, lng}` to the caller.
- Roll-level "set location" sets the roll's primary location. Per-frame flow: select one or more frame checkboxes, then "set selected location" writes the location name to just those frames; frames with no explicit location display `"<roll location> (inherited)"` — i.e., fill-forward from the roll's primary location.
- Dialog chrome: `rgba(0,0,0,.82)` scrim (no blur — that's reserved for the photo lightbox), panel `1px solid var(--border-strong)`, `var(--shadow-dialog)`.

## 4. Heading / breadcrumb / navigation consistency fixes

- **Homepage**: removed a redundant `index/` page title — the breadcrumb (`~`) and the site-tree's own root label already say this; the tree is the content, so it now opens straight onto the tree with no separate heading.
- **`/about/`**: unify the label across breadcrumb, page title, and site-tree entry to `about.md` (previously inconsistent: `about` in the crumb vs `about.md` elsewhere). General rule going forward: directory routes are bare (`work`), single-file routes keep their extension (`about.md`, `404.html`).
- **`/travel/`**: removed duplicate in-panel headings (tab bar already labels the panel — e.g. tab says "route/", panel repeated "route/" again). Kept the one-line description under the tab bar.
- **`/photos/`**: added a `rolls/` label above the roll listing to match the existing `map/`-equivalent map section above it — rule applied: only add a section label when a page has more than one distinct section (this is why `/work/` intentionally has no listing label — it's a single-section page).
- **`/work/<slug>/`**: replaced an invented "← back to work/" link (redundant with the breadcrumb, which already provides that path) with real **newer/older** prev/next navigation between adjacent work entries, styled as two bordered link tiles labelled `← newer` / `older →` with the neighboring entry's title.
- **`/photos/<roll>/`**: removed an equivalent redundant "← back to photos/" link for the same reason.

---

## Design tokens referenced
All from the existing `bjsmithxyz/beek-log` global stylesheets — no new tokens introduced. Notably:
- `--color-accent-primary` (#33ff66, green — past/travelled, links)
- `--color-accent-secondary` (#ffaa00, amber — future/tentative, warnings)
- `--color-accent-tertiary` (#66ccff, cyan — current/"here now")
- `--color-bg-secondary`, `--color-border-strong`, `--shadow-hard`, `--shadow-dialog` — panel and dialog chrome
- Font: IBM Plex Mono throughout, no new type scale values

## Assets / data referenced
- `src/data/trips.json` — real itinerary, used as-is (already exists in the repo)
- No new images or icons were introduced

## Files referenced (not duplicated in this bundle)
The source files live in the design-system project rather than copied here, to avoid clashing with the project's own component compiler:
- `ui_kits/public-site/TravelMap.jsx` — Leaflet route map component (reference for map behavior, layers, popups, `detail` prop)
- `ui_kits/public-site/Screens.jsx` — reference for the public `TravelScreen`, `WorkScreen`, `WorkDetailScreen`, `PhotosScreen`, `RollScreen`, `HomeScreen` changes described above (React prototype, not portable as-is)
- `ui_kits/admin/AdminScreens.jsx` — reference for `TravelAdmin` and the `RollEditor` location-picker wiring
- `ui_kits/admin/LocationPicker.jsx` — location picker dialog reference
- `ui_kits/public-site/App.jsx` / `ui_kits/admin/AdminApp.jsx` — reference only, for breadcrumb-label logic (`FILE_ROUTES` map)
- `assets/trips.json` — sample itinerary data shape (already exists in the real repo at `src/data/trips.json`)

Ask for these individually, or download the whole design-system project, if you need the raw files alongside this README.

Cross-reference `github.md` and `readme.md` in the design-system project for the original component-to-source mapping (which `.astro` file each recreated piece corresponds to).
