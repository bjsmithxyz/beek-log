# Long Way Round

**Live:** [travel.bjsmith.xyz](https://travel.bjsmith.xyz) (Netlify) · [GitHub Pages mirror](https://bjsmithxyz.github.io/the-long-way-round/)

An interactive map of my travels, running trip stats, and a planning panel with **live seasonal weather + daylight** for each upcoming stop. Edit in the browser after **Sign in with GitHub** (no personal access token).

- `index.html` — the whole app (map, stats, timeline, editor). No build step, no framework.
- `trips.json` — the data. Every stop lives here; the site loads it and the editor writes to it.
- `netlify/functions/` — GitHub OAuth + authenticated save of `trips.json`.

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

## Hosting on Netlify (with GitHub OAuth)

### 1. Import the repo
1. Log in at [app.netlify.com](https://app.netlify.com) with GitHub.
2. **Add new site → Import an existing project** → pick `bjsmithxyz/the-long-way-round`.
3. Build settings: leave **build command empty**, publish directory `.` (site root). Deploy.
4. Note your default URL: `https://<name>.netlify.app`.

### 2. Custom domain (`travel.bjsmith.xyz`)
1. Site → **Domain management → Add custom domain** → `travel.bjsmith.xyz`.
2. Netlify will ask for a **CNAME** to `something.netlify.app`.
3. In **GoDaddy → My Products → DNS** for `bjsmith.xyz`:
   - **Type:** CNAME  
   - **Name:** `travel`  
   - **Value:** the Netlify hostname (e.g. `something.netlify.app`)  
   - TTL: default / 1 hour  
4. Wait for DNS (often a few minutes). Netlify provisions HTTPS automatically.

### 3. GitHub OAuth App
1. GitHub → [Settings → Developer settings → OAuth Apps → New OAuth App](https://github.com/settings/developers).
2. **Application name:** Long Way Round  
3. **Homepage URL:** `https://travel.bjsmith.xyz`  
4. **Authorization callback URL:** `https://travel.bjsmith.xyz/.netlify/functions/auth-callback`  
5. Register → copy **Client ID** → generate and copy **Client secret**.

### 4. Netlify environment variables
Site → **Site configuration → Environment variables** (then trigger a redeploy):

| Variable | Example |
|----------|---------|
| `GITHUB_CLIENT_ID` | from the OAuth app |
| `GITHUB_CLIENT_SECRET` | from the OAuth app |
| `SESSION_SECRET` | long random string (e.g. `openssl rand -hex 32`) |
| `OAUTH_ALLOWED_USERS` | `bjsmithxyz` |
| `GITHUB_REPO` | `bjsmithxyz/the-long-way-round` |
| `GITHUB_BRANCH` | `main` |
| `TRIPS_PATH` | `trips.json` (optional; this is the default) |
| `SITE_URL` | `https://travel.bjsmith.xyz` |

### 5. Use the editor
1. Open the site → **✎ Edit trip** → **Sign in with GitHub**.
2. Edit stops → **Save to GitHub**. Netlify redeploys from the commit.

**Download trips.json** still works without signing in (manual commit).

### Local functions (optional)
```bash
npx netlify dev
```
Add a second OAuth callback `http://localhost:8888/.netlify/functions/auth-callback` on the OAuth app (or a separate OAuth app for local), and set `SITE_URL=http://localhost:8888` in a local `.env`.

---

## Credits
Weather & daylight: [Open-Meteo](https://open-meteo.com) · Map: [Leaflet](https://leafletjs.com) + [CARTO](https://carto.com) tiles + OpenStreetMap.
