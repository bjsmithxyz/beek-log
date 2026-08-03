# Image storage migration specification

Status: **design only**. Do not provision a bucket, rewrite Markdown, delete Git
assets, or change production rendering as part of this specification.

## Decision and goals

If repository growth becomes operationally expensive, move future and existing
web-sized film frames from Git to a Cloudflare R2 bucket served through a custom
image hostname such as `images.bjsmith.xyz`. R2 is the preferred candidate
because its object egress model is suitable for a static image site, but pricing,
limits, custom-domain behavior, and account recovery must be rechecked before
implementation.

The migration must:

- preserve every public roll URL and frame order
- retain the current 2048px maximum canonical derivative and quality target
- keep the public site static and free of credentials
- keep object-store credentials confined to authenticated admin Functions
- retain branch → PR → Deploy Preview → merge publishing
- support mixed Git-backed and object-backed rolls during migration
- provide a reversible, hash-verified transition
- stop future image growth in Git without requiring a history rewrite

Full-resolution originals remain outside the site pipeline on the owner's
personal endpoint and Proton Drive. R2 would hold web derivatives, not become
the sole archive.

## Bucket and origin

Use a dedicated private-write bucket, for example `beek-photo-frames`, with a
Cloudflare custom domain such as `images.bjsmith.xyz` for public reads. Do not
publish the S3 API endpoint or permit anonymous writes/listing.

Recommended controls:

- public `GET` and `HEAD` only through the custom domain
- no directory listing
- narrowly scoped R2 API credentials available only to production admin
  Functions
- CORS limited to `GET`/`HEAD` from `https://bjsmith.xyz` if browser CORS is
  needed; normal `<img>` loads do not require broad CORS
- `Cache-Control: public, max-age=31536000, immutable`
- correct `Content-Type: image/jpeg`, explicit byte length, and no user-supplied
  response metadata
- Cloudflare and Netlify analytics/billing alerts before rollout

The public CSP would add only `https://images.bjsmith.xyz` to `img-src`. The
admin CSP would add the same host for previews. No script or connection source
should be widened merely to display images.

## Object identity and keys

Objects are immutable and content-addressed so reorder, rename, and duplicate
frames do not copy bytes. Use a versioned key derived from the encoded canonical
JPEG:

```text
frames/v1/sha256/<first-two-hex>/<full-sha256>.jpg
```

Store these object metadata values at upload time:

- complete SHA-256 digest
- encoded byte length
- width and height
- encoder profile/version, initially `mozjpeg-q80-v1`
- creation timestamp for orphan lifecycle decisions

Never overwrite an existing key. A repeated byte upload is successful only when
its length and metadata agree with the existing object. A digest mismatch is a
hard failure.

For compatibility with the current browser payload, the storage service can
return a 40-hex opaque reference derived from the first 160 bits of SHA-256 while
retaining the full digest server-side. The roll planner—not the generic Git
publisher—resolves that reference to the complete object record. A later schema
version should rename `blobSha` to `storageRef`; that rename is cleanup, not a
migration prerequisite.

## Markdown representation

Keep roll Markdown as the canonical ordering and descriptive metadata. During a
dual-read transition, each photo `src` may be either the existing Astro local
image reference or a versioned remote record:

```yaml
photos:
  - src:
      url: https://images.bjsmith.xyz/frames/v1/sha256/ab/abcdef….jpg
      width: 2048
      height: 1365
      sha256: abcdef…
    alt: ""
    caption: optional
```

The content schema should use a discriminated union of the current `image()`
value and a strict remote object requiring:

- HTTPS on the exact configured image origin
- a path matching the content-addressed key format
- positive bounded dimensions
- a 64-character lowercase SHA-256 value matching the URL

Do not accept arbitrary remote hosts or query strings. Build validation must
reject malformed dimensions, duplicate frame references where not intentional,
and object URLs whose key disagrees with their digest.

## Rendering without `astro:assets`

Current local `ImageMetadata`, Astro `<Image>`, `getImage`, and Netlify Image CDN
transformations do not apply directly to remote R2 objects. Replace them for
remote frames with a small project-owned component that emits native `<img>`
markup with explicit width, height, lazy loading, decoding, alt text, and the
existing lightbox data attributes.

The initial migration may serve the canonical maximum-2048px JPEG at all
breakpoints to minimize moving parts. Before a large rollout, prefer
provider-independent precomputed variants at widths such as 480, 960, and 2048,
recorded together in Markdown and emitted as `srcset`. Variants should also be
content-addressed and immutable. Do not make the public site depend on a paid
runtime image transformation product unless cost and rollback are separately
approved.

Local and remote rendering must coexist until all migrated pages, Open Graph
routes, RSS, maps, lightbox behavior, and no-JavaScript image display pass the
same tests. Roll and page URLs do not change.

## Retargeting the admin boundary

`admin/src/lib/store-bytes.js` remains the only browser storage call. Its
function signature continues to accept the encoded canonical JPEG and return a
40-hex opaque `sha` plus byte count, so the encoder and editor do not need to
know whether storage is Git or R2.

Retarget the authenticated `blob-upload` service behind that boundary:

1. Apply the existing method, content type, origin, session, JPEG-signature, and
   size guards.
2. Decode dimensions and compute SHA-256 server-side; do not trust client
   metadata or a client-selected key.
3. Write-if-absent to the deterministic R2 key with immutable headers and
   metadata.
4. Verify the stored object using a `HEAD` response before returning its opaque
   reference.
5. Return safe progress/errors without exposing bucket credentials or API
   responses.

`admin/src/server/roll-publish.mjs` changes its storage-reference resolution,
not the generic publisher. For a remote-backed roll it builds Markdown that
contains guarded object records and sends only the Markdown create/update to the
existing generic Git publisher. Rename/delete operations still remain atomic at
the repository level; immutable R2 objects are garbage-collected later rather
than deleted during a user request. Existing Git frames continue to use their
current SHA path until migrated.

This preserves the editor, encoder, request guards, PR controls, and generic
publisher while changing one storage boundary and one roll-specific planner.

## Migration sequence

1. Provision the bucket, custom domain, narrow credentials, immutable headers,
   billing alerts, and a non-production test prefix.
2. Add strict remote-image schema and dual local/remote rendering with tests;
   deploy while all production Markdown remains local.
3. Retarget `storeBytes`/`blob-upload` and the roll planner. Publish and abandon a
   disposable remote draft, then create/edit/delete one through previews.
4. Send only newly created rolls to R2. Monitor object integrity, page weight,
   error rates, and costs before backfill.
5. Build a deterministic backfill tool that reads each committed JPEG, computes
   its digest/dimensions, uploads idempotently, and writes a machine-readable
   migration manifest.
6. Migrate existing rolls in small PRs. Each PR updates Markdown and deletes only
   the corresponding local frame paths after every object passes verification.
7. Verify production, retain the Git history/tag and all R2 objects through the
   rollback window, then stop accepting new Git image blobs.

Never combine bucket provisioning, renderer rollout, all-object backfill, and
Git deletion in one release.

## Integrity gate

For every migrated roll, an automated verifier must check:

- Markdown frame count and order match the pre-migration roll
- every remote URL uses the exact image origin and canonical key
- `HEAD` returns 200, JPEG content type, immutable cache policy, and expected
  byte length
- downloaded bytes hash to the recorded full SHA-256
- decoded dimensions match Markdown and neither edge exceeds 2048
- primary/per-frame locations, captions, alt values, draft state, and body are
  unchanged
- public build, roll route, photos index, Open Graph route, RSS, and lightbox
  still work
- the migration PR deletes no unrelated repository path

Store the migration manifest and verification summary in Git; do not store
credentials or full-resolution originals there.

## Backup, lifecycle, and garbage collection

R2 is not the source-original backup. Keep the owner's existing two-copy archive.
For web derivatives:

- export a periodic inventory containing keys, digests, sizes, and metadata
- retain versioned migration manifests in Git
- test restoration by re-uploading a sampled object from a full-resolution
  original and reproducing the expected canonical derivative where practical
- never apply age-based deletion to referenced objects
- mark unreferenced uploads as candidates only after scanning current `main`
- use at least a 90-day grace period before deleting unreferenced objects
- exclude objects referenced by any open admin PR during garbage collection
- log only keys/digests, never credentials or signed URLs

A failed or abandoned publication may leave immutable orphan objects. That is an
accepted safety tradeoff; asynchronous mark-and-sweep is safer than deleting
bytes during publication.

## Rollback

Before each migration batch, tag or record the exact base commit. If rendering
or storage fails:

1. Stop remote publishing by reverting the roll-planner storage feature flag.
2. Revert the migration PR so Markdown and local Git assets return together.
3. Redeploy and verify public roll URLs.
4. Keep R2 objects in place during investigation; content-addressed objects are
   harmless and may be reused.
5. Rotate R2 credentials if compromise, rather than changing public object URLs.

Because existing Git blobs remain in repository history, rollback does not
depend on R2 availability during the initial migration window. Do not garbage
collect remote objects or rewrite Git history until rollback exercises pass.

## Git history decision

Default decision: stop future growth without rewriting existing history. A
`git filter-repo` rewrite would invalidate commit IDs, clones, subtree history,
open links, Netlify caches, and operational evidence for modest immediate gain.
The existing history remains a useful rollback source.

Reconsider a rewrite only if measured clone/build costs become unacceptable.
That would require a separate approved plan, mirror backup, frozen publishing
window, force-push coordination, Netlify cache reset, collaborator re-clones,
and before/after object-count verification. It is not part of the R2 migration.

## Completion criteria

The future implementation is complete only when new uploads, mixed rendering,
backfill, rollback, orphan collection, backup restore, CSP, and cost monitoring
have all passed production-like tests. Until then, Git-backed frames and the
current hosted publisher remain authoritative.
