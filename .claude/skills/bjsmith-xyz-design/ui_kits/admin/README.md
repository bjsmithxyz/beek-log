# UI kit — admin.bjsmith.xyz

Recreation of the isolated SSR admin surface, built from `admin/src/**` in
[bjsmithxyz/beek-log](https://github.com/bjsmithxyz/beek-log). The admin mirrors the
public site's format value-for-value (a test in the repo asserts the palettes are
identical) and keeps short token aliases — `--bg`, `--panel`, `--accent` — that
point at the shared tokens.

Open `index.html` and click through: **sign-in → admin index → rolls/ → editor →
review → publication**.

| screen | source |
| --- | --- |
| sign-in panel | `admin/src/pages/index.astro` login panel + `.login-panel` styles |
| admin index tree | `admin/src/components/AdminTree.astro` |
| rolls listing | `admin/src/pages/rolls/index.astro` |
| roll editor + review + publication | `admin/src/components/RollEditor.astro` |
| location picker dialog | `admin/src/components/RollEditor.astro` `#location-dialog` |
| itinerary (`#travel`) | `admin/src/pages/travel/`, `src/data/trips.json` |

State colours follow the real editor: **amber** panel = awaiting review, **blue** =
publication in flight, **danger red** = destructive.

The **location picker** is real: search row, result list, recent chips, a live Leaflet
map you can click to drop a pin, and the four editable fields (place / lat / lng /
region). "set location" sets the roll's primary location; selecting frames and hitting
"set selected location" writes to just those frames, and unset frames show the roll
location as `(inherited)` — the fill-forward behaviour the real editor describes.

One substitution: the live admin geocodes over HTTP, so this kit searches a local
gazetteer built from `assets/trips.json`'s own stops instead. Clicking the map works
for anywhere else.

## Itinerary (`#travel`)

The authenticated itinerary is the **only** surface that shows exact dates, upcoming
legs and tentative stops — the public `/travel/` page deliberately publishes places
only (see `../public-site/README.md`). It carries an amber notice saying so, a full
route map with the `planned` layer and dated popups (`<TravelMap … detail />`), and a
dated stop table with `done` / `here now` / `planned` / `tentative` states.
