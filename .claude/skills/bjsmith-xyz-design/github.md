repo: bjsmithxyz/beek-log
branch: main

## Last sync

date: 2026-08-04T22:23:18Z

### Updated in this project

- Built the real Leaflet route map for the travel screen, from `src/data/trips.json`.
- Built the admin location-picker dialog with a live click-to-pin map.
- Imported the full itinerary (`assets/trips.json`).

## Sync history

date: 2026-08-04T14:39:10Z — initial build: tokens, 17 components, 20 foundation cards, both UI kits, assets.

## Screen map

| Project screen / file | Repo files |
| --- | --- |
| `tokens/*.css` | `src/styles/global.css`, `admin/src/styles/global.css` |
| `components/navigation/Breadcrumb` | `src/components/Breadcrumb.astro` |
| `components/navigation/SiteTree` | `src/components/SiteTree.astro`, `admin/src/components/AdminTree.astro` |
| `components/navigation/Footer` | `src/components/Footer.astro`, `src/data/site.ts` |
| `components/listing/*` | `src/components/DirListHeader.astro`, `WorkRow.astro`, `RollRow.astro`, `FilterBar.astro`, `.dir-row` in `global.css` |
| `components/media/FilmStrip` | `src/components/FilmStrip.astro`, `shared/film-stocks.ts` |
| `components/media/Lightbox` | `src/components/Lightbox.astro` |
| `components/media/WorldMap` | `src/components/WorldMap.astro`, `src/data/world-dots.json` |
| `components/core/*` | `.link-btn` / `.admin-button` / `.tag` / `.travel-stat` / `PageHeader.astro` |
| `ui_kits/public-site/` | `src/layouts/BaseLayout.astro`, `src/pages/**` |
| `ui_kits/public-site/TravelMap.jsx` | `src/pages/travel/index.astro`, `src/scripts/travel-client.js`, `src/data/trips.json` |
| `ui_kits/admin/LocationPicker.jsx` | `admin/src/components/RollEditor.astro` (`#location-dialog`) |
| `ui_kits/admin/` | `admin/src/components/RollEditor.astro`, `AdminTree.astro`, `admin/src/styles/global.css` |
| `assets/` | `public/favicon.svg`, `public/og-image.png`, `admin/public/favicon.svg`, `src/assets/**`, `src/data/world-dots.json` |
