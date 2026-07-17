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

Film rolls are **not** authored by hand — use the roll-import admin documented
in [photography.md](photography.md).

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Dev server at `localhost:4321` |
| `npm run build` | Build the production site to `./dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run astro ...` | Run Astro CLI commands |
| `npm run admin` | Roll-import admin at `127.0.0.1:4322` (create/edit rolls) |
| `npm test` | Run the unit test suite |
| `node scripts/compress-images.mjs [dir]` | Compress source images in place |

## Tests

`npm test` runs Node's built-in test runner (`node --test`) over the `*.test.mjs`
files. Coverage focuses on the pure logic behind the roll admin and the map:

- `scripts/admin/lib.test.mjs` — folder-name parsing, slug derivation, and the
  roll-markdown build/parse round-trip.
- `scripts/admin/publish.test.mjs` — frame processing and the temp-dir rebuild
  used when reordering/adding/removing frames.
- `src/data/locations.test.mjs` — `effectiveLocations` de-duplication.

The Astro pages and the admin's browser UI are verified by building and by
running the admin locally; they are not unit-tested.
