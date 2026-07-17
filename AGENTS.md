# AGENTS.md

## Cursor Cloud specific instructions

This repo is a single Astro 6 static site (`bjsmith.xyz`), package manager is **npm**
(`package-lock.json`). There is no database or backend service — all content is
file-based Markdown under `src/content/`. Standard commands live in `package.json`
and `docs/development.md`; don't duplicate them here.

### Node version (important gotcha)
- Tests require **Node >= 22.18** because `src/data/locations.test.mjs` imports a
  `.ts` file (`./locations.ts`) directly, relying on Node's native type stripping
  (enabled by default only in 22.18+). `package.json` engines says `>=22.12.0`, but
  the older `/exec-daemon/node` (22.14) on this VM makes `npm test` fail with
  `ERR_UNKNOWN_FILE_EXTENSION`.
- The environment has nvm with a default Node 22 (>=22.18) installed. Fresh shells
  source `~/.bashrc`, which re-prepends nvm's default Node ahead of `/exec-daemon`,
  so `node`/`npm`/`npm test` resolve to the correct version automatically. If a
  long-lived shell still shows the old version, run `nvm use default` (or open a new
  shell) before running tests.

### Running / testing
- `npm run dev` serves the site at `http://localhost:4321` (Astro). Draft entries
  (`draft: true`) render in dev only.
- `npm test` runs `node --test` over `*.test.mjs` (pure logic, no server needed).
- `npm run build` does a Netlify-adapter production build to `./dist/`.
- There is **no lint script**; `astro check` is not configured (no `@astrojs/check`
  dependency), so treat `npm test` + `npm run build` as the verification gate.
- `npm run admin` (dev-only roll-import CMS at `127.0.0.1:4322`) is optional and only
  needed for the photography authoring workflow; its commit/push step needs `gh` and
  geocoding hits `nominatim.openstreetmap.org`.
