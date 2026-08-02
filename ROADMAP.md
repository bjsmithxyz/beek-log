# Unified site and admin roadmap

Last updated: 2026-08-02

This is the operational development roadmap for consolidating the public site,
travel app and publishing tools. The approved architecture is in
[`docs/superpowers/specs/2026-08-02-unified-admin-design.md`](docs/superpowers/specs/2026-08-02-unified-admin-design.md).
The implementation brief remains the detailed source of acceptance criteria:
[`docs/superpowers/plans/2026-08-02-unified-admin-agent-prompt.md`](docs/superpowers/plans/2026-08-02-unified-admin-agent-prompt.md).

## Current state

| Phase | Status | Result |
| --- | --- | --- |
| 0 — repository foundation | Complete | Travel history imported; npm workspaces and pure `shared/` modules established |
| 1 — public travel route | Complete | Static `/travel/` live; legacy subdomain redirects with path/query preservation |
| 2 — admin shell and authentication | Complete | SSR admin live with GitHub App OAuth, owner allow-list, sealed sessions and public header link |
| 3 — travel publishing | In progress — live acceptance | Publisher and responsive editor are deployed; real preview/merge and phone checks remain |
| 4 — roll publishing | Planned | Desktop uploader/editor using the generic publisher |
| 5 — retirement and operations | Planned | Remove localhost publisher only after a real hosted roll succeeds |
| 6 — image-storage migration spec | Planned, specification only | Design future object-storage migration; do not implement it here |

## Verified production infrastructure

- Public site: `https://bjsmith.xyz` (`beek-log.netlify.app`)
- Travel: `https://bjsmith.xyz/travel/`
- Legacy travel alias: `travel.bjsmith.xyz` CNAME → `beek-log.netlify.app`
- Admin site: `https://admin.bjsmith.xyz` (`beekadmin.netlify.app`)
- Admin DNS: CNAME → `beekadmin.netlify.app`
- GitHub App ID: `4466745`; installed only on `bjsmithxyz/beek-log`
- GitHub repository ID: `1147572483`
- Netlify configuration: root base directory and `admin` package directory
- Secrets exist only in the admin Netlify site's environment; values are never
  recorded in this repository

Verified on 2026-08-02:

- both custom domains have valid TLS
- `travel.bjsmith.xyz/<path>` returns a permanent redirect to
  `bjsmith.xyz/travel/<path>` and preserves the query string
- the allowed owner account can sign in and out
- a second GitHub account completes OAuth but is refused server-side
- a signed-out `auth-me` request returns 401
- protected admin routes redirect to sign-in with a validated `next` path
- admin SSR and Function responses send no-store, noindex, CSP, frame denial,
  cross-origin isolation policy, HSTS and related hardening headers
- `robots.txt` disallows the complete admin site

Recreation and verification steps are in
[`docs/admin-infrastructure-setup.md`](docs/admin-infrastructure-setup.md).
Current operational details are in
[`docs/admin-operations.md`](docs/admin-operations.md).

## Phase 3 — generic publisher and travel editor

Phase 3 must prove the complete authenticated branch → PR → Deploy Preview →
merge workflow with small, known-good JSON before the image pipeline is added.

### 3.1 Generic publishing boundary

- [x] Define a declarative operation schema supporting atomic creates, updates
  and deletions in one request.
- [x] Reject unknown fields, duplicate paths, malformed base SHAs, invalid UTF-8
  text payloads and oversized requests.
- [x] Allow only explicitly configured repository namespaces. Never accept an
  arbitrary client-supplied path.
- [x] For updates/deletes, require the expected blob SHA and fail closed on a
  stale editor; for creates, require non-existence unless overwrite is an
  explicit server-approved operation.
- [x] Preserve request-guard order on every mutation endpoint: method → JSON
  content type → same origin → session/allow-list → schema → path policy →
  GitHub side effects.
- [x] Build one Git tree and one commit for the complete operation set so a
  partial failure cannot alter `main`.
- [x] Create a unique publishing branch from the current `main` SHA. Never
  update `refs/heads/main`.
- [x] Open a pull request attributed to the authenticated owner.
- [x] Poll the deterministic Netlify preview URL and surface its ready, pending
  or timed-out/failed state in the admin without broadening GitHub App permissions.
- [x] Implement merge as a separate authenticated, same-origin action after the
  owner reviews the preview.
- [x] Implement abandon as PR close plus best-effort branch deletion.
- [x] Resume a retry with the same request ID or return an explicit conflict
  without creating duplicate PRs.
- [x] Never log access tokens, refresh tokens, cookies, secrets, complete image
  payloads or authorization headers.

### 3.2 Publisher tests

- [x] Unit-test tree construction, path normalization, duplicate detection,
  overwrite guards and create/update/delete combinations.
- [x] Mock the GitHub API and verify that validation failures cause zero remote
  writes.
- [ ] Verify stale SHAs, branch collisions, partial blob failures, failed PR
  creation, preview failure, merge conflict and abandon behavior.
- [x] Verify no code path writes directly to `main`.
- [x] Test authentication, content type, method and origin failures for every
  mutation endpoint.
- [x] Test that API errors are sanitized before reaching the browser.

### 3.3 Travel editor

- [x] Replace the Phase 2 placeholder at admin `/travel/` with the ported trip
  editor.
- [x] Load `src/data/trips.json` only after server-side authentication.
- [x] Reuse `shared/trip-validation.mjs`; validate in the browser for feedback
  and again on the server before publishing.
- [x] Support add, edit, reorder and delete stop operations without changing the
  committed JSON shape.
- [x] Preserve ISO date semantics, coordinate precision and deterministic JSON
  formatting.
- [x] Implement keyboard-operable controls and responsive phone-sized layouts;
  live device verification remains in the phase gate.
- [x] Show a review summary before publishing.
- [x] Publish only `src/data/trips.json` through the generic publisher.
- [x] Display branch, PR, Deploy Preview, check status, merge and abandon
  controls in the editor.
- [ ] Complete one real travel change through preview and merge, then verify the
  public static build reflects it.

### Phase 3 gate

- [ ] `npm test` and `npm run build` pass for the public site.
- [ ] Admin tests and build pass.
- [ ] Real publishing creates a branch and PR, not a direct `main` commit.
- [ ] A working public Deploy Preview is reviewed before merge.
- [ ] Failed/abandoned publishing leaves production unchanged.
- [ ] Phone and desktop travel-editor checks pass.

Do not begin Phase 4 until this gate is recorded as complete.

## Phase 4 — hosted film-roll publisher

### 4.1 Capability gate and image storage boundary

- [ ] Detect File System Access API, Web Worker, WebAssembly and required image
  APIs before showing the uploader.
- [ ] On unsupported devices, show a clear desktop requirement and a working
  link to the travel editor.
- [ ] Define one replaceable `storeBytes` module that accepts encoded bytes and
  returns repository references. Do not spread GitHub Blob API calls through UI
  code; Phase 6 must be able to retarget this boundary.
- [ ] Proxy blob uploads through authenticated Netlify Functions with bounded
  request sizes, concurrency and safe progress/error responses.

### 4.2 Client-side image pipeline

- [ ] Use a Web Worker and `@jsquash/jpeg` for MozJPEG-family output.
- [ ] Add only the admin CSP capability required for WebAssembly
  (`'wasm-unsafe-eval'`), keeping the public CSP unchanged.
- [ ] Parse folder defaults using the shared folder-name rules.
- [ ] Generate thumbnails separately from final 2048px-long-edge output.
- [ ] Preserve orientation, strip unnecessary metadata and produce deterministic
  numbered `NNN.jpg` files.
- [ ] Revoke object URLs and release decoded image memory as work completes.
- [ ] Bound encoding/upload concurrency so large rolls do not exhaust memory.
- [ ] Report per-file and overall encode/upload progress plus actionable errors.

### 4.3 Roll create/edit/delete UI

- [ ] Implement folder picker, drag-to-order and keyboard-accessible ordering.
- [ ] Support roll date, film stock, ISO, body and optional per-frame alt text.
- [ ] Port location search → map pin → reusable chips, preserving `region` as
  the place's country.
- [ ] Port per-frame location fill-forward and bulk assignment.
- [ ] Use shared slug derivation, including Cyrillic transliteration.
- [ ] Load existing Markdown and frames for edit mode without exposing repo
  tokens to the browser.
- [ ] Preserve unchanged existing frames by SHA; upload only changed/new bytes.
- [ ] Handle slug renames atomically as old-path deletion plus new-path create.
- [ ] Implement explicit, strongly confirmed roll deletion.
- [ ] Generate Markdown through `shared/roll-markdown.mjs` with the existing
  frontmatter shape and frame numbering.
- [ ] Route create, edit, rename and delete through the Phase 3 generic
  publisher, including preview/merge/abandon controls.

### 4.4 Roll acceptance

- [ ] Create a real roll end to end from a desktop browser.
- [ ] Review its Deploy Preview and merge it from the admin.
- [ ] Compare resulting paths, Markdown and numbering with localhost output.
- [ ] Edit that roll, including frame order/location changes, through preview.
- [ ] Exercise deletion on a disposable test roll through preview.
- [ ] Verify failure during encode/upload/publish leaves `main` untouched.
- [ ] Verify unsupported/mobile capability messaging.
- [ ] Public and admin tests/builds pass.

Do not delete the localhost publisher before the real-roll acceptance test.

## Phase 5 — retirement, hardening and complete operations

- [ ] Delete `scripts/admin/server.mjs` and `scripts/admin/publish.mjs` only after
  Phase 4 production acceptance.
- [ ] Remove the root `admin` npm script and obsolete local-admin-only code and
  dependencies.
- [ ] Archive `bjsmithxyz/long-way-round`; retain or remove its old Netlify site
  only after confirming the custom-domain redirect no longer depends on it.
- [ ] Decide whether to enforce a GitHub ruleset requiring pull requests for
  `main`; document the owner decision.
- [ ] Rewrite `docs/photography.md`, `docs/architecture.md`,
  `docs/deployment.md`, `AGENTS.md` and `README.md` to remove transition-state
  language.
- [ ] Expand the operations runbook with GitHub App recreation, client/session
  secret rotation, incident logout, DNS/TLS recovery and OAuth recovery.
- [ ] Record where archival full-resolution scans live and how they are backed
  up before declaring the local workflow retired.
- [ ] Document hardware-key 2FA on the GitHub owner account as a critical
  security boundary without recording recovery secrets.
- [ ] Run final public/admin unit, build, accessibility, security-header and
  live publishing checks.

## Phase 6 — image storage migration specification only

- [ ] Write a design spec for moving roll frames to a free-egress object store
  such as Cloudflare R2; do not implement the migration in this project.
- [ ] Specify object keys, immutable/cache behavior, backup and lifecycle rules.
- [ ] Define how photo Markdown references remote frames.
- [ ] Choose replacements for `astro:assets` transformations and the Netlify
  Image CDN.
- [ ] Evaluate history rewrite with `git filter-repo` versus stopping future
  repository growth without rewriting history.
- [ ] Define migration/rollback, integrity verification and public URL
  compatibility.
- [ ] Show how Phase 4's `storeBytes` boundary retargets without changing the
  editor or generic publisher.

## Constraints that remain locked

- The public site stays static, secret-free and unpersonalized.
- Admin credentials and sessions remain isolated to `admin.bjsmith.xyz`.
- Publishing never writes directly to `main`.
- The server revalidates identity, request shape, paths and content regardless
  of browser validation.
- Draft photos render in local development and public Deploy Previews, never in
  production.
- `scripts/admin/` remains until a real hosted roll has been published.
- Node is at least 22.18; npm and `package-lock.json` remain authoritative.
- New pure logic receives unit tests; public and admin tests/builds are the
  phase gate.
