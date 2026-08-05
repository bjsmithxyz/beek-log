# bjsmith.xyz — Design System

The design language of **bjsmith.xyz**, the personal site of *beek* — a developer,
artist and film photographer based in Australia. The site is a place to put
development work, art, film photography, and travel; the visual language is
**terminal / file-browser brutalism**: one monospace face, square corners, hard
offset shadows, a faint dot grid, phosphor-green accents, and a dark default theme
with a light toggle.

Everything here was read out of the source repository. No values were invented.

## Sources

| Source | What was taken |
| --- | --- |
| https://github.com/bjsmithxyz/beek-log (branch `main`) | all tokens, all component structure, all screen recreations, all assets |
| `src/styles/global.css` | the entire token set + base layer |
| `admin/src/styles/global.css` | admin short aliases, `--color-danger` |
| `src/components/*.astro` | component inventory and exact styles |
| `src/pages/**/*.astro` | UI kit screens |
| `src/content/work/*.md`, `src/content/photos/*.md` | voice, copy examples, sample data |
| `src/data/site.ts`, `shared/film-stocks.ts` | tagline, social links, film stock names |
| `docs/architecture.md` | product boundary (public site vs admin), design-language intent |

The repository is public — **read it directly for anything this system doesn't
capture**. `docs/architecture.md`, `docs/photography.md` and
`src/components/WorldMap.astro` in particular carry detail that a design system
can only summarise.

## Products

Two surfaces, one design system (the repo enforces this: a test asserts both
palettes are value-for-value identical).

1. **bjsmith.xyz** — the public, prerendered Astro site. Routes: `/` (a filesystem
   site index), `/work/` + `/work/<slug>/`, `/photos/` + `/photos/<roll>/`,
   `/travel/`, `/about/`, `/404`. → `ui_kits/public-site/`
   *Privacy rule:* the public travel page publishes places only — no dates, no
   forward plans, no tentative stops. See `ui_kits/public-site/README.md`.
2. **admin.bjsmith.xyz** — an isolated SSR admin. GitHub App OAuth, a film-roll
   uploader that encodes images in the browser, and a publish flow that only ever
   opens reviewed pull requests. → `ui_kits/admin/`

## Index

| Path | What |
| --- | --- |
| `styles.css` | the one file consumers link — `@import`s everything below |
| `tokens/colors.css` | palette + semantic aliases + light theme |
| `tokens/typography.css` | family, size scale, weights, leading, tracking |
| `tokens/spacing.css` | 4px-based scale + semantic paddings |
| `tokens/layout.css` | containers, breadcrumb row, grid texture, listing column templates |
| `tokens/effects.css` | hard shadows, zero radius, transitions, overlay |
| `tokens/fonts.css` | IBM Plex Mono webfont load |
| `tokens/base.css` | reset, body grid texture, headings, links, containers, code |
| `guidelines/*.card.html` | 20 foundation specimen cards (Colors, Type, Spacing, Effects, Brand) |
| `components/` | 17 React primitives (below) |
| `ui_kits/public-site/` | click-through recreation of the public site |
| `ui_kits/admin/` | click-through recreation of the admin |
| `assets/` | favicons, artwork, film scans, OG image, world dot mask |
| `SKILL.md` | Agent Skills entry point |

## Components

Grouped by concern. Each directory has one `@dsCard` HTML showing states.

**`components/core/`** — `Button`, `Tag`, `Panel`, `Stat`, `StatGrid`, `PageHeader`
**`components/navigation/`** — `Breadcrumb`, `SiteTree`, `Footer`
**`components/listing/`** — `DirListHeader`, `DirRow`, `WorkRow`, `RollRow`, `FilterBar`
**`components/media/`** — `FilmStrip`, `Lightbox`, `WorldMap`

Every one of these has a counterpart in the repo (`src/components/*.astro`, or the
shared `.dir-row` / `.filter-btn` / `.link-btn` / `.travel-stat` classes in
`global.css`). Read the sibling `.prompt.md` for usage.

**Intentional additions** — three families are composed from shared CSS classes
rather than existing as their own `.astro` file:

- `Button` — the repo's `.link-btn`, `.link-btn-secondary`, `.back-home`,
  `.admin-button`, `.danger-button` and `.small-button` are one family.
- `Panel` — `.about-content`, `.editor-panel`, `.review-panel`, `.publication-panel`,
  `.login-panel` are one bordered-box family with tone variants.
- `Stat` / `StatGrid` — the travel page's `.travel-stats` grid.

**Deliberately not built** — `JsonLd` (no visual output). The `/travel/` Leaflet map
and the admin location picker live in their UI kits rather than as design-system
components, matching the source: both are page-level features, not primitives.

---

# Content fundamentals

**The site talks like a shell prompt, not a brand.**

- **All lowercase in UI.** Page titles are *paths*, not phrases: `work/`,
  `photos/`, `about.md`, `new-roll/`, `edit-roll/`, `contact-sheet/`, `gallery/`,
  `map/`, `stats/`, `route/`, `road-ahead/`, `timeline/`. Directories keep the
  trailing slash; content files keep their extension.
- **Titles of *content* keep natural case** — "MS Paint", "Dudes", "Charyn Canyon",
  "Ha Giang → Sapa → Kunming". Only chrome is lowercased.
- **`//` prefixes an aside.** Tagline: `// be excellent to each other.` Empty
  states: `// no entries`, `// no rolls yet — film's still at the lab`.
- **`→` ends an action; `←` starts a reverse one.** `view live →`, `source →`,
  `review changes →`, `upload + create pull request →`, `merge to main →`,
  `← newer`, `older →`. Home in the 404 is `> home`.
- **Brackets mark a value or a toggle**: `[dev]`, `[art]`, `[Kodak ColorPlus 200]`,
  `[all]`, `[2025]`, `[+]`, `[-]`.
- **Descriptions are terse and dry**, often a count or a joke: `paint.exe`,
  `"Just dudes being guys tbh"`, `24 entries — projects, art, photography`,
  `17 rolls — 284 frames · 9 locations`, `film not found`. The 404 reads:
  "The page you're looking for doesn't exist. Maybe you imagined it?"
- **First person, past tense, unglamorous.** From `about.md`: "My name is beek.
  I'm a creative and tech guy based in Australia. I enjoy messing around with
  technical projects and creating art, sometimes the two intersect." From a work
  entry: "Painted most of these in sets/pairs at various times over the last year."
- **Second person only in instructions** (admin hints): "Drag frames or use arrow
  buttons to reorder."
- **Separator is ` · `** for metadata runs: `Fujifilm 400 · Almaty — 18 frames`.
- **Dates**: ISO in listings and tabular-aligned (`2025-08-24`); long form on
  detail pages; `MM YY` on film edges.
- **No emoji. No exclamation marks. No Title Case buttons. No marketing verbs**
  ("unlock", "supercharge", "seamless"). Nothing is ever "excited to announce".

---

# Visual foundations

**Colour.** Three near-black planes (`#0c0c0c` page, `#141414` panel, `#1a1a1a`
raised), three greys of text (`#e8e8e8` / `#999999` / `#888888`), two hairline
greys (`#333` / `#555`), and three accents: phosphor green `#33ff66` (links, focus,
active, map pins, "now"), amber `#ffaa00` (colour-negative film edge, planned/
review states, `[art]`), cyan `#66ccff` (`[dev]`, current stop, in-flight
publication). Red `#ff6b6b` exists only in the admin. **No gradients anywhere.**
Body copy is text-*secondary*; primary is reserved for names and headings. The light
theme is warm paper (`#f4f4f0`) with darkened accents (`#008833`, `#cc7700`,
`#0066aa`) — set `data-theme="light"` and every token re-resolves.

**Type.** One family: IBM Plex Mono (fallback `'Courier New', monospace`), weights
400 / 500 / 600 plus 400 italic. Scale 0.6875rem → 3rem in nine steps; page titles
are 2.5rem/600 (2rem under 768px). Leading 1.2 headings, 1.6 UI, 1.75 prose.
Uppercase + `0.05em` tracking for micro-labels (column headers, stat captions,
badges); `0.18em` for film-edge print; `0.1em` for frame numbers. Numbers in
listings, dates and stats use `font-variant-numeric: tabular-nums`.

**Layout.** 960px max container (720px narrow for prose), 24px side padding
(16px mobile). Every page: a **static 56px breadcrumb row in the page flow** (never
sticky, never floating), then `main`, then the footer pushed down with
`margin-top: auto`. Page content pads `1.5rem` top and `8rem` bottom. Nothing is
`position: fixed` except the background grid. Listings are CSS grids with named
column templates (`--work-cols`, `--roll-cols`) shared between the header row and
its rows; below 768px the header hides and rows reflow to two columns.

**Backgrounds & texture.** A 24px line grid at 15% opacity, painted with two
`linear-gradient`s on `body::before`, `position: fixed`, `pointer-events: none`,
`z-index: 0`. It never scrolls. No photographic backgrounds, no full-bleed hero
imagery, no illustration behind text. Imagery appears only as *content*: film scans
in contact sheets and artwork in galleries, each in a plain 1px border.

**Cards — there aren't any.** The only container is a `Panel`: 1px `#333` border,
`#141414` background, **zero radius**, and a `3px 3px 0` hard offset shadow in
`#555`. Accent variants swap the shadow colour (green/amber/blue) and the border to
match. Listing rows are the same recipe with `margin-top: -1px` so adjacent borders
collapse to one hairline. There is no soft shadow, no blur-based elevation, no
rounded corner, and no coloured left border *except* the deliberate `3px` accent
rule on the travel "now" line and timeline spine.

**Borders & radius.** `--radius: 0`, everywhere, always. 1px is the default weight;
3px is the accent rule; 1px *dotted* `#555` underlines inline facts.

**Hover.** Colour and shadow shift only — nothing moves, scales, or lifts. Links go
accent-green → primary text. Rows go `#141414` → `#1a1a1a` and their `→` turns
green. Buttons invert (accent text on transparent → page-black on accent fill) and
gain a 3px accent hard shadow. Filter buttons at rest just brighten their border to
`#555`.

**Press / active / selected.** No transform, no shrink. "Selected" is expressed as
accent text + accent border + a 3px accent hard shadow (active filter chip, selected
travel tab, selected admin frame). Disabled is `opacity: .45`, `cursor: not-allowed`,
shadow removed.

**Focus.** `2px solid` accent outline at `2px` offset, globally. Skip link slides
from `top: -3rem` to `top: 0.75rem` on focus.

**Motion.** 80ms ease for colour, 120ms for opacity/borders, 200ms for the tree
branch collapse (`grid-template-rows: 1fr → 0fr` plus an opacity fade). Two
exceptions: a `steps(2, start)` blink for the travel "now" pulse and the lightbox
`loading…` label, and one springy `cubic-bezier(.34,1.56,.64,1)` scale-in when the
lightbox opens. Everything is neutralised under
`prefers-reduced-motion: reduce`.

**Transparency & blur.** Used exactly once: the lightbox scrim,
`rgba(0,0,0,0.95)` + `backdrop-filter: blur(12px)`. Map pin halos use
`opacity: 0.3`. No frosted panels, no translucent headers, no protection
gradients — labels sit on solid panels instead.

**Imagery.** Film scans, unfiltered: warm colour-negative casts and grainy B&W,
whatever the stock gave. 3:2 frames, `object-fit: cover`, 1px black border inside
the strip. Artwork is watercolour, acrylic and MS Paint, on its own. Nothing is
tinted, duotoned, overlaid or cropped to a brand shape. The film strip's base stays
`#161412` in *both* themes because it's an object, not UI.

**Maps.** Geography is dots, never tiles: a 240×120 equirectangular land mask drawn
as one `<path>` of `#555` dots, with accent-green pins and square monospace
tooltips. (The travel page is the one exception — it uses real Leaflet with CARTO
tiles, restyled square and themed.)

---

# Iconography

**There are almost no icons, on purpose.** The site says things with typography and
box-drawing characters.

- **Unicode + ASCII do the work.** Tree structure: `├──`, `└──`, `│`. Disclosure:
  `[+]` / `[-]`. Row affordance: `→`. Nav: `←` / `→`. Film advance: `▸▸`. Metadata
  separator: `·`. Comment marker: `//`. Prompt: `>`. Close: `×`. Home: `~`. These
  are typed characters in IBM Plex Mono, not glyphs from a font.
- **Two brand marks only**, both from [Simple Icons](https://simpleicons.org)
  (CC0), both in the footer: GitHub and Instagram. They ship as inline `<svg>` with
  `fill: currentColor` at 20×20 inside a 32×32 hit area. They are embedded in
  `components/navigation/Footer.jsx` — copy from there rather than re-fetching.
- **Three Feather-style stroked icons**: sun and moon (theme toggle) and left/right
  chevrons (lightbox). 24×24 viewBox, `stroke-width: 2`, round caps and joins,
  `fill: none`. They live in `Footer.jsx` and `Lightbox.jsx`. The repo hand-writes
  these rather than depending on an icon library; if you need a *new* icon, take it
  from [Lucide](https://lucide.dev) (same 24/2/round lineage) and keep it inline.
- **No icon font, no sprite sheet, no PNG icons, no emoji.**
- **Favicons**: `assets/favicon.svg` (public) and `assets/favicon-admin.svg`
  (admin) are copied verbatim from the repo. `assets/og-image.png` is the social
  card.
- **No logo exists.** The repo ships no wordmark or brand mark, so none was
  invented: wherever a logo would go, set `bjsmith.xyz` or `~/beek` in IBM Plex
  Mono, lowercase. See the "Mark + wordmark" brand card.

---

## Known substitutions & gaps

- **Fonts**: the site self-hosts IBM Plex Mono via `@fontsource`; no binaries were
  available to copy, so `tokens/fonts.css` loads the *same* family from Google
  Fonts. Same typeface — but send the `@fontsource` woff2 files if you want the
  system fully self-contained.
- **No slide template** exists in the repo, so no sample slides were authored.
- **Leaflet travel map** (`/travel/` route tab) and the admin **location picker** are
  fully built — real Leaflet 1.9.4 on CARTO tiles, themed square. The picker's place
  search uses a local gazetteer from `assets/trips.json` instead of live geocoding;
  clicking the map works for anywhere.
- Photo and artwork assets are a small sample of the repo's 600+ files, enough to
  make the kits real.
