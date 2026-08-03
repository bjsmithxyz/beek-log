# AGENTS.md

## Cursor Cloud specific instructions

This repo is an npm-workspace monorepo with two Astro 7 sites and one pure
shared package:

- repo root → static public site (`bjsmith.xyz`)
- `admin/` → SSR admin site (`admin.bjsmith.xyz`)
- `shared/` → authoring rules imported by both

Content remains file-based under `src/content/` and `src/data/`; there is no
database. Film rolls and travel data are authored through the hosted admin and
published only through reviewed pull requests.

### Node version

- Tests require **Node >= 22.18** because Node imports shared `.ts` files
  directly using native type stripping. `package.json` engines is authoritative.

### Running / testing

Public site:

- `npm run dev` → `http://localhost:4321`
- `npm test`
- `npm run build` → `./dist/`
- `npm run test:travel-clock` after a build verifies browser-derived travel dates

Admin workspace:

- `npm run dev --workspace @beek/admin`
- `npm test --workspace @beek/admin`
- `npm run build --workspace @beek/admin` → `./admin/dist/`

The admin needs the variables listed in `admin/.env.example` for live OAuth.
Neither site has lint or `astro check`; tests plus builds are the verification
gate. The retired localhost roll publisher and its direct-to-main workflow must
not be restored.
