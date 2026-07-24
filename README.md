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

## Credits
Weather & daylight: [Open-Meteo](https://open-meteo.com) · Map: [Leaflet](https://leafletjs.com) + [CARTO](https://carto.com) tiles + OpenStreetMap.
