# UI kit — bjsmith.xyz (public site)

Click-through recreation of the public Astro site, built from `src/pages/**` and
`src/components/**` in [bjsmithxyz/beek-log](https://github.com/bjsmithxyz/beek-log).

Open `index.html`. Navigation is hash-based:

| route | source page | notes |
| --- | --- | --- |
| `#` | `src/pages/index.astro` | the site index IS the homepage — collapsible ASCII tree |
| `#work` | `src/pages/work/index.astro` | filter bar + directory listing, rows show slugs |
| `#work/<slug>` | `src/pages/work/[slug].astro` | header, cover, prose, gallery grid, lightbox |
| `#photos` | `src/pages/photos/index.astro` | dot-matrix world map cross-highlighting roll rows |
| `#photos/<slug>` | `src/pages/photos/[roll].astro` | contact sheet of film strips, 6 frames each |
| `#travel` | `src/pages/travel/index.astro` | four tabs: stats / route / road-ahead / timeline |
| `#about` | `src/pages/about.astro` | single bordered bio panel |
| `#404` | `src/pages/404.astro` | big accent 404 + `> home` |

Files: `kit-data.js` (content lifted from the repo's collections), `assets/trips.json`
(the real itinerary, copied from `src/data/trips.json`), `TravelMap.jsx` (Leaflet
route map), `Screens.jsx` (one function per screen), `App.jsx` (router + shell).

### Travel privacy rule

The public travel page publishes **places, never dates, and never plans**. Concretely:

- stops with `tentative: true` and any stop whose `arrive` is in the future are filtered out entirely — they never reach the DOM;
- no `arrive`/`depart`/day-count appears anywhere: map popups carry place + country (+ "here now"), and the timeline shows place + country under a year heading;
- the `road-ahead/` tab and the `planned` map layer are gone from the public view;
- when the current stop is unpublishable, the header degrades to "last seen in <place>" rather than leaking the next one.

Full detail — exact dates, forward legs, tentative flags — lives behind auth in the
admin kit at `#travel`. `TravelMap` takes a `detail` prop that adds dates to popups;
only the admin passes it.

The travel route panel is otherwise the **real thing**: Leaflet 1.9.4 on CARTO tiles (dark or
light to match the theme), solid green polyline for travelled legs, dashed amber for
planned, circle markers coloured green / cyan / amber by status, square themed popups,
layer toggles, and a scrollable stop rail that flies the map to a stop. Day counts and
past/current/upcoming status are computed in the browser on every load — exactly as
`src/scripts/travel-client.js` does — so they can never freeze at a deploy date.

The only remaining shortcut: photo frames are the sample scans in `assets/photos/`
rather than the live Netlify Image CDN.
