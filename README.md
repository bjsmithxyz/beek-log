# Long Way Round

An interactive map of my tavels, running trip stats, and a planning panel with **live seasonal weather + daylight** for each upcoming stop. Includes an in-browser editor that commits changes straight back to GitHub.

- `index.html` — the whole app (map, stats, timeline, editor). No build step, no framework.
- `trips.json` — the data. Every stop lives here; the site loads it and the editor writes to it.

## Data model (`trips.json`)
```json
{
  "meta": { "title": "...", "subtitle": "..." },
  "stops": [
    { "name":"Amsterdam", "country":"Netherlands", "cc":"NL",
      "lat":52.3676, "lon":4.9041,
      "arrive":"2026-07-25", "depart":"2026-08-01",
      "note":"optional", "tentative":true }
  ]
}
```
Past / current / upcoming is derived automatically from today's date. Route lines follow the array order, so ordering matters. `tentative:true` shows an amber badge.

---

## Editing in the browser (with GitHub auth)
Click **✎ Edit trip**. Add, edit, reorder (↑ ↓), and delete stops for both travelled and planned legs, and use **⌖** to auto-fill coordinates + country code from a place name (Open-Meteo geocoding).

Three ways to save:
- **⤴ Save to GitHub** — commits `trips.json` directly. Needs a token (below).
- **Download trips.json** — no token; save the file and commit it yourself.
- **Preview on map** — apply edits locally to see them without saving.

### Creating the GitHub token (one time)
1. Go to **[github.com/settings/tokens](https://github.com/settings/tokens?type=beta)** → *Fine-grained tokens* → **Generate new token**.
2. **Repository access** → *Only select repositories* → `the-long-way-round`.
3. **Permissions** → *Repository permissions* → **Contents: Read and write**.
4. Generate, copy, paste into the editor's token box, hit **Save token**.

The token is kept in **sessionStorage** for the current browser tab only (cleared when you close the tab) and sent directly to `api.github.com` — it never goes anywhere else. Clear it anytime with **Clear**. After a commit, GitHub Pages redeploys in ~1 minute.

> Security note: anyone with this token can write to that one repo, so keep it to a repo-scoped fine-grained token with only Contents access, and don't use the editor on a shared computer. If you'd rather never store a token, use **Download trips.json** and commit manually.

---

## Credits
Weather & daylight: [Open-Meteo](https://open-meteo.com) · Map: [Leaflet](https://leafletjs.com) + [CARTO](https://carto.com) tiles + OpenStreetMap.
