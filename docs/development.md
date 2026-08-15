# Development

## Local setup

1. Clone the repository.
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the dev server:
   ```sh
   npm run dev
   ```
   The site runs at `http://localhost:4321`.

Entries with `draft: true` render in the dev server but are excluded from
production builds, RSS, and the sitemap — handy for previewing before publish.

## Authoring work entries

Add a markdown file to `src/content/work/`. Example frontmatter:

```markdown
---
title: "Project Name"
description: "Brief description of the work."
date: 2024-02-01
category: "dev" # or "art", "photography"
cover: "../../assets/images/cover.png"
tags: ["Astro", "TypeScript"]
liveUrl: "https://example.com"
---
```

Film rolls are **not** authored by hand — use the authenticated hosted admin
documented in [photography.md](photography.md).

The public travel itinerary lives in `src/data/trips.json`. Its shared validator
runs under `npm test` and the public build fails if the committed data is
malformed. Production edits use the authenticated admin `/travel/` page, which
commits allowed content directly to `main`. Code changes still use pull
requests.

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro ...` | Run Astro CLI commands |
| `npm test` | Run the full workspace-aware unit suite |
| `npm run verify` | Run the required unit, public-build, travel-clock, and admin-build gate |
| `npm run test:live` | Run credential-free DNS and production HTTP/security smoke checks |
| `npm run dev --workspace @beek/admin` | Admin SSR dev server |
| `npm test --workspace @beek/admin` | Admin-focused tests |
| `npm run build --workspace @beek/admin` | Build the admin site to `admin/dist/` |
| `node scripts/compress-images.mjs [dir]` | Compress source images in place |
| `npm run climate` | Fill in `src/data/climate.json` for any newly added stop |

## Tests

`npm test` runs Node's built-in test runner (`node --test`) over the `*.test.mjs`
files. Coverage focuses on the pure logic behind the roll admin and the map:

- `shared/*.test.mjs` — folder-name parsing, slug derivation, roll-Markdown
  round-trips, location helpers, constants, and trip validation.
- `src/data/locations.test.mjs` — `effectiveLocations` de-duplication.
- `admin/test/` — redirect validation, session sealing/refresh, request-guard
  order, generic Git tree publishing to `main`, roll create/edit/delete planning,
  travel schema/state logic, image boundaries, and browser-editor regressions.

Astro pages are also verified by building both workspaces. The public build
checks the filesystem-style breadcrumb labels, links, and `aria-current`
contract on representative index and detail routes, plus the public/admin links
and keyboard-safe animated disclosures in the root filesystem index. Pull requests run
`npm run verify` under the production Node 22.18 baseline in GitHub Actions; the
`Project verification` job is required by the `main` ruleset. Monthly grouped
Dependabot updates use the same gate. `astro dev` renders the admin SSR shell but
does not emulate the production custom Netlify Functions; use mocked unit tests
for publisher development and the authenticated production admin for a real
content publish.
