# Unified public site + admin subdomain — design

**Date:** 2026-08-02
**Status:** Proposed
**Supersedes:** [2026-06-15-hosted-admin-investigation.md](2026-06-15-hosted-admin-investigation.md) (DEFERRED → revisited)
**Companion:** [../plans/2026-08-02-unified-admin-agent-prompt.md](../plans/2026-08-02-unified-admin-agent-prompt.md)

## Summary

Consolidate `bjsmithxyz/long-way-round` into `bjsmithxyz/beek-log` and split the
result into **two Netlify sites from one repo**:

| Site | Domain | Base dir | Nature |
| --- | --- | --- | --- |
| Public | `bjsmith.xyz` | repo root | Astro 7, fully static, strict CSP, no auth, no secrets |
| Admin | `admin.bjsmith.xyz` | `admin/` | Astro SSR + Netlify Functions, GitHub OAuth, commits to the repo |

The trip map moves from `travel.bjsmith.xyz` to `bjsmith.xyz/travel`. The
roll-import CMS moves from `npm run admin` (local, Node + sharp + `git`) to
`admin.bjsmith.xyz/rolls`. The travel editor moves from a modal on the public
travel page to `admin.bjsmith.xyz/travel`.

Both admin tools publish via **branch + pull request**, not direct commits to
`main` — see [Publishing model](#publishing-model).

The `long-way-round` repo is archived once its history is grafted in.

## Why this shape

The 2026-06-15 investigation deferred hosting the roll admin because it was a
re-architecture and put a repo-writing tool on the public internet for a
single-user workflow. Two things changed:

1. The travel app **already** ships that exact security surface in production —
   GitHub OAuth App, server-verified `login` allow-list, sealed AES-256-GCM
   httpOnly session cookie, same-origin guard on the mutating function
   (`netlify/functions/_shared.js`, `save-trips.js`). The auth work is done and
   proven; hosting the roll admin now reuses it instead of inventing it.
2. Two repos with two deploy stories, two `netlify.toml` files, two sets of
   security headers and one shared OAuth concern does not scale to a third
   admin surface. One repo, one auth boundary, one place to add the next tool.

### The load-bearing principle

**The public site never knows who you are.** It stays a static, cacheable,
secret-free CDN artifact with `default-src 'self'`. The "login" affordance in
the header is a plain `<a href="https://admin.bjsmith.xyz/">` — no cookie on
`.bjsmith.xyz`, no session check, no SSR, no personalised HTML. Everything that
touches a token lives on the admin origin. This is what keeps the blast radius
of the admin small and the public site fast.

## Topology

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
│   ├── src/pages/        # /, /rolls, /rolls/new, /rolls/[slug], /travel
│   └── netlify/functions/
└── netlify.toml          # public site config (unchanged in spirit)
```

Netlify resolves `netlify.toml` **relative to the site's base directory**, so
site A reads the root file and site B reads `admin/netlify.toml`. Both sites
watch the same repo and therefore both build on every push — set
`[build] ignore` in each `netlify.toml` so a photo-roll commit doesn't burn
admin build minutes and vice versa (Free plan: 300 build min/month).

### Shared code

`shared/` holds only **pure, dependency-light modules** — no Node built-ins, no
Astro imports, no `sharp`. Both Astro apps import them by relative path
(`../../shared/slug.mjs`). This is deliberately simpler than npm workspaces; if
Vite/Astro resolution outside each project root proves painful in either app,
the fallback is to convert the repo to npm workspaces with `shared` as a
package. Decide this in Phase 0, not later.

Moving these modules is what stops the hosted admin from becoming a second,
drifting copy of the roll-authoring rules. `rollInputErrors`, `slugify`,
`deriveSlug`, `buildRollMarkdown` and the `photos` Zod schema must have exactly
one definition each.

## Auth

Reuse the long-way-round model verbatim, with the cookie renamed
`tlwr_session` → `beek_session`:

- **One GitHub OAuth App**, `admin.bjsmith.xyz`, callback
  `https://admin.bjsmith.xyz/.netlify/functions/auth-callback`.
- `/.netlify/functions/auth-login` → GitHub with a `state` bound to a
  short-lived cookie; `auth-callback` exchanges `code` → token, **verifies
  `login` against `OAUTH_ALLOWED_USERS` server-side**, seals `{login, token,
  exp}` into an httpOnly + Secure + SameSite=Lax cookie.
- Every mutating function re-checks the session *and* the allow-list *and*
  `isSameOrigin`. Never trust a client-sent identity.
- Session TTL drops from 7 days to **24 hours** — this session can commit to a
  public repo, which is a bigger grant than editing `trips.json`.

### OAuth App vs GitHub App — resolved: GitHub App

An OAuth App needs the `public_repo` scope, which grants write to **every**
public repo the account owns, forever, with no way to narrow it. A **GitHub App**
installed only on `beek-log` with `contents: write` + `pull_requests: write`
issues tokens that literally cannot reach anything else.

**A GitHub App is not a service.** It is a registration form at
*Settings → Developer settings → GitHub Apps*, exactly like an OAuth App — no
server to run, no extra hosting, no daemon. The Netlify functions are the same
functions.

Use **user-to-server** tokens, not installation tokens:

- The flow is the same OAuth dance already implemented — `client_id` /
  `client_secret`, redirect to `/login/oauth/authorize`, exchange `code` for a
  token. `auth-login` and `auth-callback` barely change.
- The token acts as **you**, so commits and PRs are attributed to your account,
  not to a bot.
- Its reach is the intersection of the app's declared permissions and the repos
  the app is installed on. Install on `beek-log` only.
- **No private key, no JWT signing.** Those are only needed for installation
  (app-as-itself) tokens, which this design doesn't use — so no PEM in env vars.

The one real wrinkle: GitHub App user tokens expire after 8 hours and come with
a refresh token. There is a per-app setting to opt out of expiring user tokens
(verify it is still offered — GitHub has been nudging toward always-expiring).
Either disable expiry, or implement refresh in `readSession` and re-seal the
cookie; the latter is ~20 lines and strictly better practice.

Net: identical infrastructure, one extra setup page, and a token whose blast
radius shrinks from "every public repo I own" to "one repo, two permissions".

### Deep linking

The public header link may carry a destination: `admin.bjsmith.xyz/?next=/rolls/new`.
`auth-callback` returns to `next` **only if it is a same-origin absolute path**
(`^/[a-z0-9/_-]*$`) — never an arbitrary URL, or the callback becomes an open
redirect.

## Publishing model

`npm run admin` commits straight to `main`, and two safety properties come free
with being local: `draft: true` renders in `astro dev` so you can look before
you publish, and a bad write is `git reset` away. Hosting the admin destroys
both — there is no dev server and no working tree.

So the hosted admin **never writes to `main` directly**. Every publish:

1. Creates a branch (`roll/<slug>`, `travel/<timestamp>`) off the current head.
2. Commits the tree to that branch.
3. Opens a pull request via the GitHub API.
4. Netlify builds a **Deploy Preview** for the PR — the lost preview step,
   restored, and viewable on whatever device you're holding.
5. The admin polls the PR for its deploy-preview URL and mergeability, shows
   both, and offers a **Merge** button. Merging to `main` triggers the
   production deploy.

This gives preview and rollback (close the PR, or revert the merge commit) for
the cost of one extra build per publish, and it makes a half-finished roll a
branch rather than a broken homepage. The admin should also list open publish
PRs on the dashboard so nothing is left dangling.

**Cost interaction — this turned out to favour the PR model.** Netlify's
self-serve plans are credit-based (accounts created before 2025-09-04 are on
Legacy build-minute plans; **switching is irreversible**, so confirm which
applies before optimising for either). Under credits:

- **Deploy Previews, branch deploys and failed deploys are not metered at all.**
- A **production deploy costs 15 credits**, flat, regardless of build duration.
- **Bandwidth costs 20 credits/GB**; web requests 2 credits per 10,000.
- Free = 300 credits/month with a **hard limit** (no overage — you stop).

So the PR workflow is effectively free: the preview build costs nothing, and
only the merge triggers a metered production deploy. Build *duration* stopped
mattering, which also defuses the worry about image-heavy Astro builds.

The real exposure is **bandwidth on a photo site**. 300 credits is ~15GB/month
*if nothing else is spent*, and every production deploy takes 15 credits off
that. With 223MB of frames on the site, a handful of thorough visitors or an
ill-behaved crawler is the dominant cost — not publishing. Implications:

- `[build] ignore` commands remain worth setting, but for tidiness now, not
  budget.
- The Lighthouse plugin's audit set no longer needs to stay small for build-time
  reasons.
- Keep the immutable `/_assets/*` caching, and make sure Image CDN derivatives
  (not originals) are what gets served.
- A `robots.txt` crawl-delay and keeping the admin `noindex` are cost controls,
  not just hygiene.

### One generic publish path, not one per tool

The publish machinery is built as **"commit this file set to a branch and open a
PR"**, not as roll-publishing with trip-publishing bolted alongside. The
interface is roughly:

```
publish({ branch, message, files: [{ path, blobSha | content | null }], prTitle, prBody })
```

where a `null` blob deletes the path. Rolls, trips, deletions, and any later
tool (`work/` entries, a drafts toggle) are all callers. This costs almost
nothing now — rolls and trips already need the same tree/commit/PR sequence —
and it pays three times over: the Phase 6 storage retarget touches one module,
adding a tool doesn't mean adding a code path, and there is exactly one place
where the allow-list, same-origin and path-validation checks live.

Tool-specific logic (building roll markdown, validating trips) stays in the
callers. The publish module knows nothing about film.

### Deletion

The admin can **delete a roll**, and because deletion goes through the same
generic path it arrives as a PR that removes `src/content/photos/<slug>.md` and
the whole `src/assets/photos/<slug>/` directory. That makes an irreversible-
feeling action reviewable and revertible: you see the diff, the Deploy Preview
shows the site without it, and closing the PR is the undo.

The local tool never supported this — deletions were manual git operations — so
this is new surface. Guard it accordingly: require the slug to be typed to
confirm, never accept a path from the client (derive every path from the
validated slug), and refuse a delete that would touch anything outside those two
locations.

**Succeeding `.admin.log`.** The local tool keeps a capped publish log
(`scripts/admin/.admin.log`). Under the PR model, git history plus the PR list
covers it; no separate log is needed. Verify that before deleting the local
tool rather than assuming it.

## Public `/travel`

Port `index.html` + `styles.css` + `app.js` (~27KB) into Astro components under
`src/pages/travel/`, dropping the editor modal entirely.

Four concrete frictions, the first of which fails **silently**:

0. **All date-derived state must stay client-side.** `app.js:9` is
   `const now = new Date()` at module scope, evaluated in the browser on every
   page load — which is why "Day 137 on the road" and the past / current /
   upcoming classification are always correct today. Astro prerenders at build
   time. Move any of that into `.astro` frontmatter and the page freezes at the
   last deploy date and drifts a day at a time with no error. Keep the
   derivation in a client script; the `.astro` component may emit `trips.json`
   and static chrome only. Add a test asserting the built HTML contains no
   computed day count.

1. **CSP.** The public site is `script-src 'self'`. The travel app currently
   loads Leaflet from unpkg, fonts from Google, and tiles from CARTO. Fix by
   `npm install leaflet` and bundling it (matches the site's self-hosted-fonts
   ethos), then adding a **route-scoped** header block for `/travel/*` widening
   only `img-src` (CARTO tiles) and `connect-src` (`archive-api.open-meteo.com`,
   `geocoding-api.open-meteo.com`). Do not widen the site-wide CSP.
2. **Visual identity.** The travel app is Fraunces + Source Sans + gradients
   with its own dusk toggle; the site is IBM Plex Mono terminal brutalism with a
   dark/light toggle. Restyle onto `src/styles/global.css` tokens and delete the
   app's own theme toggle — one toggle, one aesthetic. Swap CARTO
   `dark_all` / `light_all` tiles with the site theme.
3. **Data.** `trips.json` → `src/data/trips.json`. Keep `trip-validation.mjs` as
   the shared validator (the admin function needs it too) and optionally mirror
   it as a Zod schema so a malformed commit fails the build loudly rather than
   rendering an empty map.

### Retiring the subdomain

Add `travel.bjsmith.xyz` as a domain alias on the **public** site with an
explicit full-URL redirect, because Netlify's default alias behaviour would
send `travel.bjsmith.xyz/x` to `bjsmith.xyz/x`, not `/travel/x`:

```toml
[[redirects]]
  from = "https://travel.bjsmith.xyz/*"
  to = "https://bjsmith.xyz/travel/:splat"
  status = 301
  force = true
```

The DNS CNAME stays. Also update `src/content/work/the-long-way-round.md`
(`liveUrl`, `repoUrl`) and the `travel` entry in `src/components/Header.astro`
from an external URL to `/travel/`.

## The roll admin — the genuinely hard part

Everything the local admin does with the filesystem, `sharp`, and `git` needs a
replacement. The mapping from the 2026-06-15 doc still holds; the new detail is
**how the images actually get to GitHub**.

### Folder convention survives

`<input type="file" webkitdirectory multiple>` exposes `file.webkitRelativePath`,
so the top-level folder name is still available in the browser and
`parseFolderName()` still auto-fills date, stock, and country from
`2026-06-02 - kodak-portra-400-PT`. The authoring muscle memory is preserved.

### The roll uploader is desktop-only, by decision

Supporting phones meant resumable uploads against iOS tab suspension, a
Pointer-Events rewrite of drag-to-reorder, a no-folder-name manual entry path,
HEIC handling, and single-frame decode budgeting — a large fraction of Phase 4's
complexity for a flow nobody wants to perform on a phone anyway. Dropped.

Instead, **detect and advise**. Do it by *capability*, not by user-agent string
or screen width — the thing that matters is whether the browser can do the job:

```js
const canPickFolder = 'webkitdirectory' in document.createElement('input');
const canDrag = matchMedia('(pointer: fine)').matches;
```

If either is false, the roll uploader renders an explanatory panel — "roll
publishing needs a desktop browser; the travel editor works here" — instead of
the tool, and links to the travel editor. Don't silently degrade and don't
UA-sniff; a large tablet with a mouse should work, and a desktop browser at a
narrow window should not be locked out.

**The travel editor is exempt.** It is a form of place names and dates with no
image processing, and its whole reason for existing is editing an itinerary
while travelling — the moment you are least likely to have a laptop. It gets a
responsive layout and works on a phone. Only the roll uploader is gated.

### Where the masters live

The repo holds a lossy 2048px derivative, not the archival scan. Locally that
was implicit — the originals sat next to the repo on one machine. Publishing
from anywhere makes it explicit and undefined: decide where the full-resolution
scans are stored and backed up, and write it into `docs/photography.md`. The
admin should not be the only copy of anything.

### Client-side image pipeline

- Thumbnails (220px q60) and previews (1024px q70) via `createImageBitmap` +
  canvas — instant, no server round trip.
- Final frames: longest edge ≤ 2048, JPEG q80. `canvas.toBlob('image/jpeg', 0.8)`
  works but its encoder differs from `mozjpeg`; use **`@jsquash/jpeg` (WASM
  mozjpeg) in a Web Worker** for byte-level parity with existing rolls, with
  canvas as the fallback.
- **EXIF orientation is a correctness bug waiting to happen.** `sharp.rotate()`
  auto-orients today; the browser equivalent is
  `createImageBitmap(blob, { imageOrientation: 'from-image' })`. Miss it and
  half the frames publish sideways. Re-encoding also strips EXIF entirely —
  which is a bonus: no GPS coordinates leak into a public repo.

### Getting the frames into one commit

Measured, not estimated: the 19 rolls in the repo hold 511 frames totalling
223MB — **~443KB per frame, ~11.7MB per roll**. Because the client resizes and
encodes *before* uploading, the payload is the finished 2048px frame, not the
source scan. A 36-frame roll is therefore ~16MB total and ~590KB per request
once base64'd (+33%).

That is comfortably inside Netlify's **6MB** synchronous body cap, so the
per-frame upload is not the risk it first appears. The chunked design is still
correct — but for retryability, progress reporting, and atomicity, not because
of the size limit.

1. `POST /.netlify/functions/publish-blob` — one frame per request, base64,
   proxied to `POST /repos/:owner/:repo/git/blobs`. Returns the blob SHA.
   Client uploads with concurrency 2–3 and a progress bar; failures retry
   individually without restarting the roll. Reject any single frame over ~3.5MB
   raw as a defensive cap.
2. `POST /.netlify/functions/publish-open-pr` — takes the markdown body plus the
   `{path, sha}` list, reads the current head of `main`, builds a **tree** (with
   `sha: null` entries to delete superseded frames on an edit), creates a
   **commit**, creates `refs/heads/roll/<slug>` pointing at it, then opens a
   pull request.

Because the work lands on a fresh branch, "the remote moved ahead" stops being a
failure mode entirely — the branch is created from whatever head it read, and
any conflict surfaces later as a non-mergeable PR that GitHub explains for you,
rather than as a `PATCH` rejection mid-publish. Nothing can leave a dangling
local commit because there is no local anything, and nothing can half-land
because the tree+commit is a single atomic creation.

The merge step is a separate function (`publish-merge`) so it re-authenticates
and re-checks the allow-list independently.

### Guards that must be ported, not reinvented

- **Overwrite guard** — a write may only land on its own roll. Read the
  `src/content/photos/` tree from GitHub before committing and 409 on a slug
  that belongs to a different roll (`server.mjs` publish route).
- **Frame paths are server-generated** — `src/assets/photos/<slug>/NNN.jpg` built
  from a server-validated `^[a-z0-9-]+$` slug and an index. Never interpolate a
  client-supplied filename into a tree path.
- **Verify uploads are actually JPEG** (magic bytes) server-side before making a
  blob.
- **Geocoding** — proxy Nominatim through a function (it requires a
  `User-Agent`, rate-limits to ~1 req/s, and the admin CSP should stay
  `connect-src 'self'`). Keep the client-side debounce.

### Editing existing rolls

The local admin reads rolls from disk. Hosted, read them via the GitHub Contents
API and parse with the shared `parseRollMarkdown`. Reordering must renumber
frames; the tree-based commit makes "rebuild the whole frame set atomically"
natural.

## What survives locally

`scripts/admin/server.mjs` and `publish.mjs` are the Node/filesystem/`git`
layer — those retire. `lib.mjs`, `slug.mjs`, `loc-utils.mjs` and their tests are
pure logic and **move to `shared/`**, keeping the existing test suite as the
regression net for the hosted rewrite. Keep `npm run admin` working until the
hosted flow has published a real roll, then delete it in one commit.

## Security requirements (non-negotiable)

- Single GitHub identity, allow-listed and verified server-side.
- Client secret and session secret in Netlify env vars only.
- Sealed, httpOnly, Secure, SameSite=Lax, 24h session cookie.
- OAuth `state` bound to a cookie; `next` restricted to same-origin paths.
- Same-origin + method + content-type checks on every mutating function.
- Body size caps and per-request frame-count caps.
- Admin site: `X-Robots-Tag: noindex, nofollow`, a disallow-all `robots.txt`, no
  sitemap, `frame-ancestors 'none'`, CSP at least as strict as the public site.
- Never log the token, and keep it out of any error message returned to the
  client.
- `SECRETS_SCAN_OMIT_KEYS` in `admin/netlify.toml` as long-way-round does.

Two things this model rests on that aren't code:

- **The GitHub account is the whole security boundary.** Every control above
  reduces to "only bjsmithxyz can do this", which reduces to the account not
  being compromised. Hardware-key 2FA on that account is load-bearing
  infrastructure, not hygiene. State it in the runbook.
- **HSTS `includeSubDomains`** is already set on `bjsmith.xyz`, which means
  `admin.bjsmith.xyz` must serve valid HTTPS from its very first request —
  there is no plain-HTTP window during DNS cutover. Netlify provisions the
  certificate automatically, but don't test the new subdomain over HTTP and
  conclude it's broken.
- **Secret rotation.** Write down how to rotate `SESSION_SECRET` (invalidates
  all sessions — that's the point) and the OAuth client secret, and how to
  recover if the OAuth app is deleted. A runbook nobody has ever read is worth
  less than one written while the setup is fresh.

## Phasing

Each phase ships independently and leaves the site working.

| Phase | Outcome |
| --- | --- |
| 0 | History grafted, `shared/` extracted, tests green, nothing user-visible changed |
| 1 | `bjsmith.xyz/travel` live, subdomain 301s, nav updated |
| 2 | `admin.bjsmith.xyz` live: OAuth, session, allow-list, dashboard showing "signed in as X" and nothing else |
| 3 | Travel editor on the admin (port of proven `save-trips.js`) |
| 4 | Roll admin on the admin (new: image pipeline, blob proxy, tree commit) |
| 5 | `scripts/admin/{server,publish}.mjs` deleted, `long-way-round` archived, docs rewritten |
| 6 | *(separate spec)* Frames migrated out of git — see below |

Phase 3 before Phase 4 deliberately: it proves the whole auth + commit path with
code that already works in production, so Phase 4's failures are unambiguously
about the image pipeline.

### Phase 6 — image storage, deferred but scheduled

Measured today: `.git` is **298MB**, `src/assets/photos` is **223MB** across 19
rolls, growing ~11.7MB per roll and **permanently** — git history never shrinks,
every clone and every Netlify build pays it. At 100 rolls that's ~1.2GB. The
irony of this project is that making publishing frictionless accelerates the
problem.

Deliberately **not** solved here: moving frames to object storage (Netlify
Blobs, R2, S3) means giving up `astro:assets` and the Netlify Image CDN
integration that currently generates responsive derivatives, which is a real
loss and a real reshaping of Phase 4. Bundling it with the consolidation would
stall both.

**A second argument arrived with the pricing research:** under credit-based
billing, Netlify charges **20 credits per GB of bandwidth**, and frames are
almost all of this site's bytes. Moving them to a store with free egress
(Cloudflare R2 in particular) would cut the dominant running cost, not just the
clone size. That reframes Phase 6 from "repo hygiene" to "the thing that keeps
this site on a cheap plan" — worth weighing against losing `astro:assets`.

But write the spec now, while the repo is still ~300MB and the migration is a
weekend rather than a project. It should cover: where frames live, how
`src/content/photos/*.md` references them, what replaces `astro:assets`
transforms, whether history gets rewritten (`git filter-repo`) or just stops
growing, and how the Phase 4 upload path retargets. Phase 4's blob-proxy
function should be written with that retarget in mind — one module that owns
"put these bytes somewhere and return a reference", not GitHub API calls
smeared through the publish flow.

## Verification gate

Per `AGENTS.md`: there is no lint script and `astro check` is not configured, so
the gate is `npm test` + `npm run build`, on Node ≥ 22.18 (the test suite relies
on native type stripping). The admin app needs its own equivalent gate. Add
tests for every new pure module — tree-building, path generation, the overwrite
guard, the `next` redirect validator — since none of them can be smoke-tested
without hitting GitHub.

## Decisions taken

- **Public travel** at `bjsmith.xyz/travel`, ported to Astro; subdomain 301s.
- **Topology** one repo, two Netlify sites, `admin/` base dir.
- **Admin stack** Astro SSR + Netlify Functions, importing `shared/` directly.
- **Publishing** branch + PR + Deploy Preview + merge-from-admin, never a direct
  commit to `main`; one generic file-set publish path shared by all tools.
- **Image storage** stays in git for now; Phase 6 spec written during this work.
- **Devices** the roll uploader is desktop-only and says so via capability
  detection; the travel editor works on a phone; the public site stays fully
  responsive.
- **Deletion** supported for rolls, as a PR, with typed-slug confirmation.
- **Auth** GitHub App with user-to-server tokens, installed on `beek-log` only.
- **Discoverability** a visible login/admin affordance in the public header.

## Open questions

1. `@jsquash/jpeg` for encoder parity, or accept canvas output and let existing
   rolls differ slightly in bytes?
2. `trips.json` as a plain data file, or a Zod-validated content collection so a
   bad commit fails the build? (The PR model softens this — a bad commit fails
   the Deploy Preview before it can reach `main`.)
3. Graft `long-way-round` history via `git subtree add --prefix=travel-legacy`,
   or start clean and rely on the archived repo for history? Note this adds to
   the repo-size problem above; a clean copy may be the better trade.
4. Where do the archival full-resolution scans live, and what backs them up?
   Laptop + phone is two copies of the same working set, not a backup.

**Resolved:** stay on the Netlify **Free** plan. Since Deploy Previews are
unmetered and build duration doesn't affect cost, the PR workflow adds
essentially nothing; bandwidth against the 300-credit hard limit is the only
real exposure, and that's a billing decision to take if and when it bites — not
a design constraint. Note the account may still be on a Legacy build-minute
plan; switching to credit-based is irreversible, so don't switch casually.
