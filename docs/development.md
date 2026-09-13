# Development

## Local setup

```sh
npm install
npm run dev        # http://localhost:4321
```

Entries with `draft: true` render in dev but are excluded from production builds,
RSS, and the sitemap.

## Authoring

**Work entries** — add a markdown file to `src/content/work/`:

```markdown
---
title: "Project Name"
description: "Brief description."
date: 2024-02-01
category: "dev" # or "art", "photography"
cover: "../../assets/images/cover.png"
tags: ["Astro", "TypeScript"]
liveUrl: "https://example.com"
---
```

**Film rolls** are not hand-authored — use the hosted admin
([photography.md](photography.md)).

**Travel** lives in `src/data/trips.json` (validated by `npm test` and the
build); production edits go through the admin `/travel/` page. Code changes use
pull requests.

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build to `./dist/` |
| `npm run preview` | Preview the production build |
| `npm test` | Full workspace unit suite |
| `npm run verify` | Required gate: unit + public build + travel-clock + admin build |
| `npm run test:live` | Credential-free DNS/HTTP/security smoke checks |
| `npm run climate` | Fill `src/data/climate.json` for new stops |
| `node scripts/compress-images.mjs [dir]` | Compress source images in place |
| `npm run <cmd> --workspace @beek/admin` | Run `dev` / `test` / `build` for the admin |

## Tests

`npm test` runs Node's test runner (`node --test`) over `*.test.mjs`, covering
the pure logic behind the roll admin and map:

- `shared/*.test.mjs` — folder/slug parsing, roll-Markdown round-trips, location
  helpers, constants, trip validation.
- `src/data/locations.test.mjs` — `effectiveLocations` de-duplication.
- `admin/test/` — redirects, session sealing/refresh, request-guard order, Git
  tree publishing, roll/travel planning, image boundaries, editor regressions.

Both workspace builds also run as verification: the public build checks
breadcrumb labels/links/`aria-current` and the homepage index disclosures.
PRs run `npm run verify` on Node 22.18 in GitHub Actions; the `Project
verification` job is required by the `main` ruleset. `astro dev` renders the
admin shell but not its production Functions — use mocked unit tests for
publisher work and the production admin for a real publish.
