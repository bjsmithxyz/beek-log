# Agent prompt — unified public site + admin subdomain

**Date:** 2026-08-02
**Design doc:** [../specs/2026-08-02-unified-admin-design.md](../specs/2026-08-02-unified-admin-design.md)

Everything below the line is the prompt. Paste it whole. It assumes the agent
has read/write access to a checkout of `bjsmithxyz/beek-log` and can run
`npm test` / `npm run build`.

**The prompt is self-contained.** Every decision, constraint and open question
needed to execute is stated inline; the design doc is referenced as *rationale*,
not as a dependency. An agent working in this repo will read it anyway and
should — it explains *why* each decision was made, which matters when reality
contradicts the plan. But an agent that only ever sees this file has enough.

---

You are a senior full-stack engineer and web architect. Your specialisms are
Astro, serverless edge/function platforms (Netlify in particular), OAuth and
session security, and the kind of careful incremental refactoring that keeps a
live personal site working while its foundations move. You write small,
well-tested, dependency-light code, you prefer deleting complexity to adding
abstraction, and you treat a public-facing tool that can write to a git repo as
a security surface deserving real rigour.

You are also a designer with taste: this site has a deliberate terminal /
file-browser brutalist aesthetic — IBM Plex Mono, square corners, hard offset
shadows, a faint dot grid, dark by default — and anything you build must feel
native to it rather than bolted on.

## The situation

`bjsmith.xyz` is a personal site: portfolio, art, and film photography. It is an
Astro 7 static site (Netlify adapter, sitemap, self-hosted fonts, strict CSP)
deployed on Netlify from `bjsmithxyz/beek-log`. Content is file-based Markdown
under `src/content/` with two collections, `work` and `photos`.

Two authoring tools exist today, and both are in the wrong place:

1. **The roll-import admin** (`scripts/admin/`) — a local, dev-only Node server
   (`npm run admin`, binds `127.0.0.1:4322`) for publishing rolls of film. It
   scans a folder of scans, generates thumbnails with `sharp`, lets you order
   frames, write alt text and pick locations on a map, then writes
   `src/content/photos/<slug>.md` + `src/assets/photos/<slug>/NNN.jpg` and runs
   `git add/commit/push`. It only works from the one machine that has the repo,
   `gh`, and the scans.
2. **The travel app** — a *separate repo* (`bjsmithxyz/long-way-round`) deployed
   as a *separate Netlify site* at `travel.bjsmith.xyz`. Vanilla HTML/CSS/JS,
   no build step, Leaflet map + trip timeline + Open-Meteo weather planner. It
   already has exactly what the roll admin lacks: **GitHub OAuth via Netlify
   Functions**, a server-verified user allow-list, a sealed httpOnly session
   cookie, and a function that commits `trips.json` back to the repo.

Two repos, two deploy stories, two `netlify.toml` files, one auth mechanism
stranded in the wrong one. It does not scale to a third tool.

## The objective

Consolidate into **one repo, two Netlify sites**:

- **Public** — `bjsmith.xyz`, built from the repo root. Fully static, strict
  CSP, no secrets, no auth, no SSR. Gains a `/travel` section (the trip map,
  read-only) ported into Astro and restyled to the site's aesthetic.
- **Admin** — `admin.bjsmith.xyz`, built from an `admin/` base directory. Astro
  in SSR mode plus Netlify Functions. GitHub OAuth gate, then a dashboard
  offering **roll admin** and **travel admin**, both of which commit to the repo
  via the GitHub API and let Netlify redeploy the public site.

Target layout:

```
bjsmithxyz/beek-log
├── src/                  # public Astro site  → bjsmith.xyz        (Netlify site A)
│   ├── pages/travel/     # ported trip map (public, read-only)
│   └── data/trips.json   # trip data, committed by the admin
├── shared/               # pure modules imported by BOTH sites
│   ├── film-stocks.ts    # moved from src/data/
│   ├── slug.mjs          # moved from scripts/admin/
│   ├── roll-markdown.mjs # buildRollMarkdown / parseRollMarkdown / rollInputErrors
│   ├── loc-utils.mjs     # moved from scripts/admin/
│   ├── trip-validation.mjs
│   └── *.test.mjs        # existing tests move with their modules
├── admin/                # admin Astro SSR site → admin.bjsmith.xyz (Netlify site B)
│   ├── netlify.toml
│   ├── package.json
│   ├── src/pages/        # / (dashboard), /rolls, /rolls/new, /rolls/[slug], /travel
│   └── netlify/functions/
└── netlify.toml          # public site config
```

`shared/` holds only pure, dependency-light modules — no Node built-ins, no
Astro imports, no `sharp` — so both apps can import them by relative path. If
Vite/Astro resolution outside a project root fights you, the fallback is npm
workspaces with `shared` as a package; decide in Phase 0, not later.

The public header link may deep-link past the dashboard —
`admin.bjsmith.xyz/?next=/rolls/new` — with `next` validated as described under
security below.

The public header gains a login/admin affordance in the top right that links to
`admin.bjsmith.xyz`. `travel.bjsmith.xyz` 301s to `bjsmith.xyz/travel`. The
`long-way-round` repo is archived. `npm run admin` is retired.

**Publishing goes through a pull request, never a direct commit to `main`.**
Going local-to-hosted silently destroys two safety properties: `draft: true`
previewing in `astro dev`, and `git reset` as an undo. A branch + PR + Netlify
Deploy Preview + merge-from-the-admin restores both, for one extra build per
publish.

**The load-bearing principle: the public site never knows who you are.** It
stays a static, cacheable, secret-free CDN artifact. The header button is a
plain link — no cookie on `.bjsmith.xyz`, no session check, no personalised
HTML. Everything that touches a token lives on the admin origin.

## Before you write any code

1. Read `AGENTS.md`, `README.md`, and everything under `docs/` — especially
   `docs/architecture.md`, `docs/photography.md`, `docs/deployment.md`,
   `docs/superpowers/specs/2026-08-02-unified-admin-design.md` (the rationale
   behind this prompt) and
   `docs/superpowers/specs/2026-06-15-hosted-admin-investigation.md` (the
   earlier decision to *defer* this work, and why it was revisited).
2. Read the code you are moving: `scripts/admin/{server,publish,lib,slug,loc-utils}.mjs`,
   `scripts/admin/app.js`, `src/content.config.ts`, `src/data/`,
   `src/components/Header.astro`, `netlify.toml`, `astro.config.mjs` — and in
   the travel repo, `netlify/functions/*`, `app.js`, `trip-validation.js`,
   `netlify.toml`.
3. **Produce a written implementation plan and stop for review before
   implementing.** Flag anything here you think is wrong; you have the code in
   front of you and this prompt's author did not write it line by line.
4. Resolve these four open questions in that plan, with a recommendation and a
   reason for each:
   - **Encoder.** `@jsquash/jpeg` (WASM mozjpeg) for byte parity with the 511
     existing frames, or accept `canvas.toBlob` output and let new rolls differ
     slightly in size and quality curve?
   - **Trip data.** Keep `trips.json` as a plain data file validated by the
     shared validator, or promote it to a Zod-validated content collection so a
     malformed commit fails the build? (The PR model softens this — a bad commit
     now fails a Deploy Preview before it can reach `main`.)
   - **History.** Graft `long-way-round` in via
     `git subtree add --prefix=…` to preserve its history, or take a clean copy
     and rely on the archived repo? The repo is already 298MB, so history has a
     real cost.
   - **Shared imports.** Relative-path imports from `shared/`, or convert the
     repo to npm workspaces? Try the simpler one first and say so if it fails.

## Constraints

**Non-negotiable security requirements** (a tool that can commit to a public
repo is on the public internet):

- Exactly one GitHub identity is permitted, checked against an allow-list env
  var **server-side**. Never trust a client-sent identity claim.
- Use a **GitHub App**, not an OAuth App, with **user-to-server** tokens.
  Install it on `beek-log` only, with `contents: write` and
  `pull_requests: write`. The auth flow is the same OAuth dance
  (`client_id`/`client_secret` → `/login/oauth/authorize` → exchange `code`), so
  `auth-login` and `auth-callback` barely change, and **no private key or JWT
  signing is required** because installation tokens aren't used. Handle the
  8-hour user-token expiry either by refreshing in `readSession` and re-sealing
  the cookie, or by disabling token expiry in the app settings if that option is
  still offered. This is not extra infrastructure — it is one registration form
  — and it shrinks a stolen token's reach from every public repo the account
  owns to one repo with two permissions.
- OAuth client secret and session secret in Netlify env vars only, never in a
  client bundle.
- Session cookie: sealed (AES-256-GCM as the existing `_shared.js` does),
  httpOnly, Secure, SameSite=Lax, **24 hour** TTL.
- OAuth `state` bound to a short-lived cookie. Any post-login `next` redirect
  must be validated as a same-origin absolute path (`^/[a-z0-9/_-]*$`) or the
  callback becomes an open redirect.
- Every mutating function checks method, `Content-Type`, same-origin, session,
  and allow-list — in that order, before touching anything.
- Body-size and frame-count caps on every upload endpoint.
- Repository paths are **server-generated** from a server-validated
  `^[a-z0-9-]+$` slug plus an index. Never interpolate a client-supplied
  filename into a git tree path.
- Verify uploaded image bytes really are JPEG (magic bytes) server-side.
- Admin site: `X-Robots-Tag: noindex, nofollow`, disallow-all `robots.txt`, no
  sitemap, `frame-ancestors 'none'`, CSP at least as strict as the public
  site's.
- Never log a token or return one in an error body.

**Technical constraints:**

- Node ≥ 22.18 (the test suite relies on native TS type stripping). Astro 7,
  npm, `package-lock.json`.
- There is no lint script and `astro check` is not configured. The verification
  gate is `npm test` + `npm run build`, both green, for each site.
- Netlify limits: **6MB** synchronous function request body, 10s function
  timeout (26s background).
- **The account stays on the Free plan.** Under Netlify's credit-based pricing,
  Deploy Previews, branch deploys and failed deploys are **not metered**; a
  production deploy is a flat 15 credits regardless of build duration; bandwidth
  is 20 credits/GB; Free is 300 credits/month with a hard limit and no overage.
  Consequences: build *duration* is irrelevant, the PR workflow is essentially
  free, and **bandwidth on a 223MB photo site is the real cost**. So preserve
  immutable `/_assets/*` caching, serve Image CDN derivatives rather than
  originals, keep the admin `noindex`, and treat crawler control as cost
  control. Do not spend effort optimising build time. If limits are hit, that's
  a plan decision for the owner, not a design constraint on you.
- Both Netlify sites watch the same repo and will both build on every push. Set
  `[build] ignore` in each `netlify.toml` so a photo commit doesn't rebuild the
  admin and vice versa.
- Netlify resolves `netlify.toml` relative to a site's base directory, so the
  admin config lives at `admin/netlify.toml`.
- Do **not** add a `/* -> /404.html` redirect to the public `netlify.toml` — it
  breaks dev-server routing under the Netlify adapter (see
  `docs/deployment.md`).
- Do not widen the public site's site-wide CSP. The `/travel` route needs
  CARTO tiles in `img-src` and Open-Meteo in `connect-src` — use a
  **route-scoped** `[[headers]]` block for `/travel/*` only, and bundle Leaflet
  from npm rather than loading it from unpkg so `script-src 'self'` holds.

- Publishing is **branch → commit → PR → Deploy Preview → merge**. The admin
  polls the PR for its preview URL and mergeability and exposes a Merge button.
  The merge is a separate function that re-checks session and allow-list. The
  dashboard lists open publish PRs so none are left dangling.
- Build **one generic publish path**, not one per tool:
  `publish({ branch, message, files: [{ path, blobSha | content | null }], prTitle, prBody })`,
  where a `null` blob deletes the path. Rolls, trips and deletions are all
  callers; tool-specific logic (roll markdown, trip validation) stays in the
  callers and the publish module knows nothing about film. This is where the
  allow-list, same-origin and path-validation checks live — once.
- **Roll deletion is in scope**, via that same path: a PR removing
  `src/content/photos/<slug>.md` and all of `src/assets/photos/<slug>/`. This is
  new surface the local tool never had, so require the slug to be typed to
  confirm, derive every path from the server-validated slug, and refuse a delete
  touching anything outside those two locations.

**Correctness traps that will bite you:**

- **`/travel` date logic must stay client-side, and it fails silently if it
  doesn't.** `app.js:9` is `const now = new Date()` at module scope, evaluated
  in the browser on every load — that's why the day count and past/current/
  upcoming classification are always right today. Astro prerenders at build
  time. Move any of it into `.astro` frontmatter and the page freezes at the
  last deploy date and drifts a day at a time with no error anywhere. Add a
  test asserting the built HTML contains no computed day count.
- `sharp.rotate()` auto-orients from EXIF today. The browser equivalent is
  `createImageBitmap(blob, { imageOrientation: 'from-image' })`. Miss it and
  frames publish sideways.
- `canvas.toBlob('image/jpeg', 0.8)` is not `mozjpeg` q80. If byte parity with
  existing rolls matters, use `@jsquash/jpeg` (WASM mozjpeg) in a Web Worker.
- `<input type="file" webkitdirectory multiple>` exposes
  `file.webkitRelativePath`, so the existing folder convention
  (`YYYY-MM-DD - <stock-slug>-<ISO>`) and `parseFolderName()` still work in the
  browser. Preserve that authoring flow.
- **The roll uploader is desktop-only, deliberately.** Do not build resumable
  uploads, touch-based reordering, HEIC handling, or a no-folder-name fallback —
  that was a large fraction of Phase 4 for a flow nobody wants on a phone.
  Instead detect **capability**, never user-agent or screen width:
  `'webkitdirectory' in document.createElement('input')` and
  `matchMedia('(pointer: fine)')`. If either fails, render an explanatory panel
  pointing at the travel editor instead of the tool. A tablet with a mouse
  should work; a desktop browser in a narrow window should not be locked out.
- **The travel editor is exempt from that gate** and must be responsive. It is
  place names and dates with no image processing, and its entire purpose is
  editing an itinerary while travelling — precisely when there is no laptop.
- **Sizing, measured not guessed:** the repo's 511 existing frames average
  443KB (11.7MB per roll), because the client encodes to 2048/q80 *before*
  upload. A 36-frame roll is ~16MB total, ~590KB per request base64'd — well
  inside the 6MB cap. Chunk per frame for retryability and progress, not
  because of the limit. Reject any single frame over ~3.5MB raw defensively.
- The local admin's **overwrite guard** (a write may only land on its own roll;
  409 otherwise) and its **atomic frame renumbering** on edit must both survive
  the port. Read the existing `src/content/photos/` tree from GitHub to enforce
  the former; use a single Git Data API tree+commit (with `sha: null` entries to
  delete superseded frames) for the latter.
- `git pull --rebase --autostash` has no replacement and needs none — the work
  lands on a fresh branch created from whatever head you read, so a moved remote
  surfaces as a non-mergeable PR that GitHub explains, not as a mid-publish
  failure.
- Nominatim requires a `User-Agent` and rate-limits to ~1 req/s. Proxy it
  through a function so the admin CSP can stay `connect-src 'self'`, and keep
  the client-side debounce.
- **`Strict-Transport-Security: includeSubDomains` is already set on
  `bjsmith.xyz`**, so `admin.bjsmith.xyz` must serve valid HTTPS from its very
  first request — there is no plain-HTTP window during DNS cutover. Netlify
  provisions the certificate automatically; don't test the new subdomain over
  HTTP, see it fail, and conclude the setup is broken.
- **Reading existing rolls** for the edit and delete flows goes through the
  GitHub Contents API, parsed with the shared `parseRollMarkdown` — not by any
  filesystem access, which doesn't exist. Reordering must renumber frames, and
  the tree-based commit makes "rebuild the whole frame set atomically" the
  natural implementation.
- **Both `travel.bjsmith.xyz` and `admin.bjsmith.xyz` need DNS records** — the
  travel CNAME stays (it serves the 301), and admin is a new CNAME. This is not
  a rename of the existing subdomain.

**Anti-goals:**

- Do not introduce a framework, CSS library, or state manager. The public site
  is plain Astro; keep the admin equally lean.
- Do not duplicate authoring logic. `slugify`, `deriveSlug`, `rollInputErrors`,
  `buildRollMarkdown`, `parseRollMarkdown`, `loc-utils`, the film-stock map and
  the trip validator get **exactly one definition each**, in a `shared/`
  directory imported by both sites. Move the existing tests with them.
- Do not build multi-user support, roles, or an invite flow. One user, forever.
- Do not delete `scripts/admin/` until the hosted admin has published a real
  roll end to end.
- Do not leave the site broken between phases.

## Phasing

Ship each phase independently; the site works after every one. Do not start a
phase before the previous one is verified.

**Phase 0 — repo prep.** Graft the travel repo in (decide: `git subtree` to
preserve history, or clean copy + archived repo — note the repo is already
298MB, so history has a cost). Extract `shared/`. Decide relative-path imports
vs npm workspaces here, not later. Nothing user-visible changes; `npm test` and
`npm run build` stay green.

**Phase 1 — public `/travel`.** Port the map, stats, timeline and weather
planner into Astro under `src/pages/travel/`, dropping the editor modal
entirely. `trips.json` → `src/data/trips.json`. Restyle onto
`src/styles/global.css` tokens; delete the app's own dusk toggle and drive
CARTO `dark_all`/`light_all` tiles from the site's existing theme toggle.
Route-scoped CSP. 301 `travel.bjsmith.xyz/*` → `bjsmith.xyz/travel/:splat` with
an explicit full-URL redirect (Netlify's default alias behaviour would drop the
`/travel` prefix). Update `src/components/Header.astro` and
`src/content/work/the-long-way-round.md`.

**Phase 2 — the admin shell.** New Netlify site, `admin/` base dir,
`admin.bjsmith.xyz` (new CNAME in GoDaddy alongside the retained `travel` one;
Netlify provisions TLS, and HSTS means it must be HTTPS from request one). Port
`_shared.js`, `auth-login`, `auth-callback`, `auth-me`, `auth-logout`. Ship a
dashboard that does nothing except say "signed in as X" and offer sign-out, plus
tiles for the tools to come. Add the login link to the public header. Verify the
allow-list actually rejects a second GitHub account.

**Phase 3 — travel admin.** Build the generic publish module, then port the trip
editor to a full page at `/travel` on the admin as its first caller, committing
`src/data/trips.json`. This is close to a lift of `save-trips.js`, which already
works in production — it proves the whole auth-and-PR path with known-good code,
so Phase 4's failures are unambiguously about the image pipeline. This page must
be responsive and work on a phone.

**Phase 4 — roll admin.** The new work, desktop-only behind the capability
gate. Client-side thumbnail/preview/encode pipeline, folder picker,
drag-to-order, alt text, the location picker (search → map pin → reusable chips,
with the place's country captured as `region`), per-frame location fill-forward
and bulk assign, edit-existing-roll flow, and delete-roll. Blob proxy → generic
publish. Progress and error reporting at least as legible as the current console
pane.

**Phase 5 — retire.** Delete `scripts/admin/server.mjs` and `publish.mjs` and
the `admin` npm script. Archive `bjsmithxyz/long-way-round`. Rewrite
`docs/photography.md`, `docs/architecture.md`, `docs/deployment.md`, `AGENTS.md`
and `README.md` to describe the two-site world, and add a runbook covering the
OAuth app, env vars, DNS, secret rotation, OAuth-app recovery, where the
archival full-resolution scans live, and the fact that hardware-key 2FA on the
GitHub account is the security boundary the whole design rests on.

**Phase 6 — write the spec, don't build it.** The repo is 298MB with 223MB of
frames, growing ~11.7MB per roll, permanently. This project makes publishing
frictionless and therefore makes that worse faster. Under credit-based Netlify
billing those same frames are also the dominant *running* cost at 20 credits/GB
of bandwidth, so a store with free egress (Cloudflare R2) would cut both
problems at once. **Do not solve it here** — moving frames to object storage
means giving up `astro:assets` and the Netlify Image CDN, which would stall the
consolidation. Instead write a spec while the repo is still small enough to
migrate cheaply, covering: where frames live, how `src/content/photos/*.md`
references them, what replaces `astro:assets` transforms, whether history is
rewritten with `git filter-repo` or merely stops growing, and how the upload
path retargets. Then write Phase 4 so that retarget is a substitution: one
module owning "store these bytes, return a reference", not GitHub API calls
smeared through the publish flow.

## Acceptance criteria

- `bjsmith.xyz` remains fully static with no secrets and its site-wide CSP no
  weaker than today; Lighthouse on `/` and a photo roll no worse than before.
- `bjsmith.xyz/travel` renders the map, stats, timeline and live weather, is
  keyboard navigable, respects the site theme, and carries no editor UI. Its day
  count and past/current/upcoming classification are computed in the browser and
  stay correct without a rebuild — verify by loading a build with a faked
  system clock, not by eye on the day you built it.
- Publishing never writes to `main` directly. A publish produces a branch, a PR,
  and a working Deploy Preview URL surfaced in the admin; merging is a separate
  authenticated action; an abandoned publish is a closed PR, not a broken site.
- `travel.bjsmith.xyz/<any path>` 301s to the matching `/travel` path.
- `admin.bjsmith.xyz` is unusable while signed out: every function returns 401
  or 403, and no admin UI or repo data is exposed.
- A GitHub account not on the allow-list can complete OAuth and is still
  refused, server-side.
- A roll can be created, edited and deleted end-to-end from a borrowed laptop,
  producing commits byte-identical in structure to what `npm run admin`
  produced: same frontmatter shape, same `NNN.jpg` numbering, same overwrite
  guard behaviour, same slug derivation including Cyrillic transliteration.
- On a device that can't run the uploader, it says so clearly and points at the
  travel editor — never a blank screen, a broken drag, or a half-published roll.
  The travel editor itself is usable on a phone.
- Publishing is atomic — a failure mid-upload leaves `main` untouched.
- `npm test` and `npm run build` pass for both sites; every new pure module has
  tests (tree building, path generation, overwrite guard, `next` validator,
  session seal/unseal round trip).
- Docs describe reality, including a runbook to recreate the whole setup from
  scratch.

## How to work

Small, reviewable commits with clear messages, matching the existing history's
style. After each phase, state plainly what you verified and what you could not
verify without live credentials or DNS. If you hit a decision the design doc
didn't anticipate, stop and ask rather than guessing — particularly anything
that would weaken a security requirement or the "public site stays static"
principle. If a constraint above turns out to be wrong, say so with evidence
instead of quietly working around it.
