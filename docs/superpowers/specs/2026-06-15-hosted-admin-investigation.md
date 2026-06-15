# Hosting the roll-admin on Netlify — investigation (DEFERRED)

**Date:** 2026-06-15
**Status:** Investigated, deferred — admin stays local

## Context

The roll-admin (`scripts/admin/`) is a **local, dev-only** tool (`npm run admin`,
binds 127.0.0.1, not part of the Astro build). We investigated deploying it to
Netlify at `admin.bjsmith.xyz` with GitHub authentication so rolls could be
published from anywhere.

**Decision: keep it local — do not host (for now).** Hosting is a full
re-architecture (not a port), and it puts a tool that can commit to the repo on
the public internet — a real security surface. For a single-user workflow the
cost outweighs the benefit. This doc records the findings and the recommended
shape **if revisited**. No code, config, or admin behavior changed.

## Why hosting is a re-architecture, not a lift-and-shift

The local admin relies on things Netlify's serverless/ephemeral runtime does not
provide (no repo filesystem, no `git`, no `gh`). Each must be replaced:

| Local behavior (today) | Hosted replacement required |
| --- | --- |
| `/api/scan` reads a local image folder (`srcPath`) — `scripts/admin/server.mjs:64` | Browser **file upload** (drag/drop); no server filesystem |
| `sharp` resize 2048 + `mozjpeg` q80 (`scripts/admin/publish.mjs:43`), thumbs q60 (`server.mjs:51`) | **Client-side resize** in the browser (canvas, or WASM mozjpeg e.g. `@jsquash/jpeg` for parity). Avoids sharp bundling + function size/time limits; the Netlify Image CDN already re-transforms for display |
| `git add/commit/push` — `scripts/admin/publish.mjs:88-100` | **GitHub API commit** (Git Data API: blobs → tree → commit on `main`). Pushing to `main` auto-triggers the public site's Netlify deploy |
| `gh auth status` check — `checkGitHubAuth` in `publish.mjs` | **GitHub OAuth** + server-verified owner allow-list + signed session cookie |
| Read existing rolls/frames from disk (`server.mjs:134-179`) | Read via **GitHub API** (or the public site's data) for the edit flow |

**Ports over largely unchanged:** the Nominatim geocode proxy (`server.mjs:82`),
the location-picker UI + `loc-utils.mjs`, Cyrillic `slugify` (`app.js:145`),
`buildRollMarkdown` frontmatter format (`lib.mjs:63`), and the photos Zod schema
(`src/content.config.ts:28`).

## Recommended approach if revisited

- **Topology — a separate Netlify site** (same repo, own base dir e.g. `admin/`,
  own build) served at `admin.bjsmith.xyz`. Keeps the public site's static build
  and strict CSP (`netlify.toml`) untouched; isolated, independent deploys.
- **Auth — GitHub OAuth App.** `/auth/login` → GitHub → `/auth/callback`
  serverless function exchanges `code`→token, **verifies `login === "bjsmithxyz"`
  server-side**, sets a signed httpOnly session cookie. Reject everyone else.
- **Commit — the signed-in user's token**, used server-side only during the
  publish request, scope = contents:write on `beek-log`. Commits attributed to
  the user.
- **Publish function** builds the same files the local tool writes
  (`src/content/photos/<slug>.md` + `src/assets/photos/<slug>/NNN.jpg`) into one
  GitHub commit via the Git Data API.
- **Images processed client-side** before upload (resize to 2048, encode JPEG).

### GoDaddy DNS (admin.bjsmith.xyz)

1. In Netlify: add `admin.bjsmith.xyz` as a custom domain on the admin site.
2. In GoDaddy DNS: add a **CNAME** — host `admin`, value
   `<admin-site>.netlify.app` (default TTL). The apex record stays as-is; this
   only adds the subdomain.
3. Netlify auto-provisions a Let's Encrypt certificate for the subdomain once DNS
   resolves.

### Security caveats (non-negotiable if built)

- Lock access to the single GitHub identity, **verified server-side** — never
  trust a client-sent identity claim.
- Session cookie: httpOnly, Secure, SameSite=Lax, signed and short-lived.
- Keep the OAuth client secret in Netlify env vars, never in the client bundle.
- The admin site's own CSP/headers should be at least as strict as the public
  site's.

## Decision

Deferred. The admin stays local (`npm run admin`). This document is the reference
for a future revisit.
