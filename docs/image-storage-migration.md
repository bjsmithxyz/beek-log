# Image storage migration specification

Status: **design only.** Do not provision a bucket, rewrite Markdown, delete Git
assets, or change rendering until a trigger below is met and a plan is approved.

## Baseline and triggers

Baseline (2026-08-03, commit `11b9559`): ~544 roll JPEGs ≈ 235 MiB under
`src/assets/photos/`; local `.git` ≈ 313 MiB; warm public build ≈ 4 s. Recheck
quarterly:

```sh
du -sh src/assets/photos .git
git ls-files 'src/assets/photos/**' | wc -l
time npm run build
```

Start an implementation plan (not an automatic migration) when any one holds:

- tracked web derivatives exceed 500 MiB
- a clean clone's `.git` exceeds 1 GiB
- median public deploy exceeds ten minutes, primarily from image handling
- Netlify/GitHub storage, transfer, API, or billing limits materially bite
- Git blob-upload failures make the hosted publisher unreliable

Until then, keep the Git-backed pipeline and keep measuring. Crossing a trigger
starts the staged review below — it never permits skipping the dual-read,
integrity, preview, or rollback gates.

## Decision and goals

If growth becomes expensive, move web-sized frames from Git to a Cloudflare R2
bucket served via a custom hostname (e.g. `images.bjsmith.xyz`). Recheck R2
pricing, limits, custom-domain behavior, and account recovery first. The
migration must: preserve every roll URL and frame order; keep the 2048px/q80
canonical derivative; keep the public site static and credential-free; confine
R2 credentials to authenticated admin Functions; keep direct-to-`main` publishing
with server path policy; support mixed Git- and object-backed rolls; be
reversible and hash-verified; and stop Git image growth without a history rewrite.
Full-resolution originals stay on the owner's endpoint + Proton Drive — R2 holds
derivatives, not the archive.

## Bucket and origin

Private-write bucket (e.g. `beek-photo-frames`); public `GET`/`HEAD` only through
the custom domain; no listing; no anonymous writes; API credentials scoped to
production admin Functions only. Serve `Cache-Control: public, max-age=31536000,
immutable`, correct `image/jpeg` + byte length, no user-supplied response
metadata. CORS only if needed (`GET`/`HEAD` from `https://bjsmith.xyz`). Add
`https://images.bjsmith.xyz` to `img-src` in both CSPs — widen nothing else. Set
billing alerts before rollout.

## Object identity

Immutable, content-addressed keys so reorder/rename/duplicate never copy bytes:

```text
frames/v1/sha256/<first-two-hex>/<full-sha256>.jpg
```

Store per object: full SHA-256, byte length, width/height, encoder profile
(`mozjpeg-q80-v1`), creation timestamp. Never overwrite a key; a repeat upload
succeeds only if length + metadata agree; a digest mismatch is a hard failure.
The storage service may return a 40-hex opaque ref (first 160 bits) for payload
compatibility while keeping the full digest server-side; the roll planner resolves
it. Renaming `blobSha` → `storageRef` is later cleanup, not a prerequisite.

## Markdown and schema

Roll Markdown stays canonical for ordering/metadata. During dual-read, a photo
`src` is either the current Astro local image or a remote record
(`{ url, width, height, sha256 }`). The schema uses a discriminated union of the
current `image()` value and a strict remote object requiring: HTTPS on the exact
image origin; a path matching the content-addressed key; positive bounded
dimensions; a 64-hex lowercase SHA-256 matching the URL. Reject arbitrary hosts,
query strings, malformed dimensions, and key/digest disagreement at build time.

## Rendering

`astro:assets`/`<Image>`/Netlify CDN don't apply to remote objects. Add a small
project component emitting native `<img>` with explicit width/height, lazy
loading, decoding, alt, and the existing lightbox data attributes. Initially serve
the 2048px canonical at all breakpoints; before a large rollout, precompute
content-addressed variants (e.g. 480/960/2048) recorded in Markdown and emitted as
`srcset`. Don't depend on a paid runtime transform product without separate cost +
rollback approval. Local and remote rendering must coexist until all pages, OG
routes, RSS, maps, lightbox, and no-JS display pass the same tests; URLs don't
change.

## Admin boundary

`admin/src/lib/store-bytes.js` stays the only browser storage call; its signature
(encoded JPEG → 40-hex `sha` + byte count) is unchanged. Retarget `blob-upload`
behind it: apply existing method/type/origin/session/JPEG-signature/size guards;
decode dimensions and compute SHA-256 server-side (never trust client
metadata/key); write-if-absent to the deterministic key with immutable headers;
`HEAD`-verify before returning the ref; surface safe errors only.
`roll-publish.mjs` changes only its reference resolution — it builds Markdown with
guarded object records and sends the Markdown change to the existing Git
publisher. Rename/delete stay atomic at the repo level; immutable objects are
GC'd later, not deleted in a request. Existing Git frames keep their path until
migrated.

## Sequence (never combine steps in one release)

1. Provision bucket, domain, narrow credentials, immutable headers, alerts, test
   prefix.
2. Ship strict remote schema + dual rendering with tests, while all Markdown stays
   local.
3. Retarget `storeBytes`/`blob-upload` + planner; exercise a disposable remote
   draft and a create/edit/delete through previews.
4. Send only new rolls to R2; monitor integrity, page weight, errors, cost before
   backfill.
5. Build a deterministic backfill tool (read JPEG → digest/dimensions → idempotent
   upload → machine-readable manifest).
6. Migrate existing rolls in small PRs; each updates Markdown and deletes only its
   local frames after every object verifies.
7. Verify production, hold Git history/tag + all R2 objects through the rollback
   window, then stop accepting new Git image blobs.

## Integrity gate (per migrated roll)

Frame count/order match pre-migration; every URL uses the exact origin + canonical
key; `HEAD` returns 200, JPEG type, immutable cache, expected length; downloaded
bytes hash to the recorded SHA-256; decoded dimensions match Markdown and ≤2048;
locations/captions/alt/draft/body unchanged; public build, roll route, photos
index, OG, RSS, lightbox all work; the PR deletes no unrelated path. Store the
manifest + verification summary in Git (never credentials or originals).

## Backup, GC, rollback

R2 isn't the source-original backup — keep the two-copy archive. Export periodic
key/digest/size inventories; retain manifests in Git; test restoration from a
full-res original. Never age-delete referenced objects; mark unreferenced uploads
only after scanning `main`; ≥90-day grace before deleting; exclude objects
referenced by any open PR; log only keys/digests. Abandoned publishes may leave
immutable orphans — an accepted tradeoff (async mark-and-sweep beats deleting
bytes during publication).

Rollback: tag the base commit before each batch; revert the planner flag to stop
remote publishing; revert the migration PR so Markdown + local assets return
together; redeploy and verify URLs; keep R2 objects in place (content-addressed,
reusable); rotate R2 credentials rather than changing public URLs on compromise.
Because Git blobs remain in history, rollback doesn't depend on R2 during the
initial window; don't GC objects or rewrite history until rollback exercises pass.

## Git history

Default: stop future growth without rewriting history — a `git filter-repo`
rewrite would invalidate commit IDs, clones, links, Netlify caches, and evidence
for modest gain. Reconsider only if measured clone/build costs become
unacceptable; that needs a separate approved plan (mirror backup, frozen window,
force-push coordination, cache reset, re-clones, before/after counts) and is not
part of this migration.

**Complete only when** new uploads, mixed rendering, backfill, rollback, orphan
collection, backup restore, CSP, and cost monitoring all pass production-like
tests. Until then the Git-backed pipeline is authoritative.
