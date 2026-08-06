# Admin operations and handoff

This document records the deployed admin topology and routine owner operations.
For recreation from scratch, use
[`admin-infrastructure-setup.md`](admin-infrastructure-setup.md). For development
status and remaining work, use [`../ROADMAP.md`](../ROADMAP.md).

## Production inventory

| Resource | Value |
| --- | --- |
| Public origin | `https://bjsmith.xyz` |
| Public Netlify hostname | `beek-log.netlify.app` |
| Travel origin | `https://bjsmith.xyz/travel/` |
| Travel compatibility host | `travel.bjsmith.xyz` → `beek-log.netlify.app` |
| Admin origin | `https://admin.bjsmith.xyz` |
| Admin Netlify hostname | `beekadmin.netlify.app` |
| Admin package directory | `admin` (repository root remains the base) |
| GitHub repository | `bjsmithxyz/beek-log` |
| GitHub repository ID | `1147572483` |
| GitHub App ID | `4466745` |
| GitHub App Client ID | `Iv23li0ooi4MWMFc4MpI` |
| Allowed GitHub login | `bjsmithxyz` |

The App ID and Client ID are public identifiers, not credentials. The client
secret, session secret, OAuth tokens and cookie values must never be added here.
No GitHub App private key is required or expected.

## Netlify layout

Both sites use the same public GitHub repository and `main` branch.

- Public site: root `netlify.toml`, static output in `dist/`.
- Admin site: root base directory, `admin` package directory,
  `admin/netlify.toml`, SSR output in `admin/dist/`, custom functions in
  `admin/netlify/functions/`.
- The public site always rebuilds on push. Admin build-ignore skips content-only
  commits; changes to shared workspace configuration rebuild admin where needed.
  GitHub Actions also hits the public Netlify build hook when public paths land
  on `main` (and nightly for travel freshness).

The admin site's environment contains these keys:

- `ADMIN_SITE_URL`
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_REPOSITORY_ID`
- `OAUTH_ALLOWED_USERS`
- `SESSION_SECRET`

On plans without production-only Function scoping, retain Netlify's **Require
approval** sensitive-variable policy for untrusted deploys. Never approve an
outside admin Deploy Preview before reviewing its code for environment access.

## Authentication model

1. `auth-login` creates state and a PKCE verifier, seals both into a short-lived
   host-only cookie, and redirects to the GitHub App authorization endpoint.
2. `auth-callback` verifies state, exchanges the code with PKCE, loads the
   GitHub identity and checks the single-user allow-list on the server.
3. The GitHub user token and refresh token are sealed with AES-256-GCM in
   `__Host-beek_session`; no session database is used.
4. The cookie is Secure, HttpOnly, SameSite Lax, host-only, path `/`, and has a
   24-hour absolute lifetime.
5. GitHub access tokens are refreshed before their approximately eight-hour
   expiry without extending that absolute session lifetime.
6. The GitHub App is installed only on `bjsmithxyz/beek-log` with **Contents**
   read/write. Pull requests permission is not required (publishes commit
   straight to `main`).

Source: `admin/src/server/auth.mjs`. Tests: `admin/test/auth*.test.mjs`.

## Publishing endpoints

The Phase 3 travel publisher is deployed. All repository data endpoints require
a valid owner session; mutations additionally require POST JSON and a matching
admin Origin before parsing their strict schemas.

| Function | Purpose |
| --- | --- |
| `travel-data` | Load and validate `src/data/trips.json` plus its current blob SHA |
| `publish-start` | Validate travel data and commit the update directly to `main` |
| `rolls-data` / `roll-data` | Load guarded roll inventories and Markdown for editing |
| `blob-upload` | Store one authenticated encoded JPEG as an unreferenced Git blob |
| `publish-roll` | Map strict create/edit/rename/delete input to allowed roll paths and commit to `main` |
| `geocode` | Throttled same-origin proxy for location and country lookup |

The browser never chooses an arbitrary repository path. Travel publishing is
server-mapped to `src/data/trips.json`; roll publishing is server-mapped to one
Markdown path and sequential `NNN.jpg` paths. Stale SHA and complete-inventory
checks prevent overwriting a newer edit or leaving old frames behind. Path
segments of `.` / `..` are rejected before the allowlist runs. A
client-generated UUID tags the commit message; retries with the same ID return
the prior commit instead of writing twice. Image uploads accept no path, remain
dangling blobs until linked, and are rate-limited; publish endpoints are also
rate-limited per session. Before attaching a `.jpg` blob SHA, the publisher
verifies JPEG magic bytes. Commit titles/messages and roll titles reject
control characters so trailers cannot be injected into the Git commit message.

Source: `admin/src/server/publisher.mjs`, `request-guards.mjs`, and
`travel-publish.mjs`. Tests: `admin/test/publisher.test.mjs`,
`publish-functions.test.mjs`, and `travel-*.test.mjs`.

## Security headers

`admin/netlify.toml` protects static assets. Netlify's static custom-header
rules do not apply to SSR and Function responses, so
`admin/src/server/headers.mjs` applies the complete policy at the response
source. Do not remove either layer.

A signed-out check should show:

```sh
curl -sSI https://admin.bjsmith.xyz/
curl -sS -D - -o /dev/null \
  https://admin.bjsmith.xyz/.netlify/functions/auth-me
```

Expected controls include no-store, noindex, script-src self only, frame denial,
COOP/CORP, content-type sniffing denial, referrer policy, permissions policy and
HSTS. `auth-me` should be HTTP 401 while signed out.

## Routine verification

The credential-free portion runs every Monday in
[`.github/workflows/production-smoke.yml`](../.github/workflows/production-smoke.yml)
and can also be dispatched manually with `npm run test:live`. It checks both
CNAMEs, representative public routes, the path/query-preserving travel redirect,
the admin robots policy, and the signed-out identity response plus security
headers. GitHub Actions failures are the operational alert; do not add secrets
to this workflow.

Repository-level Dependabot vulnerability alerts and automated security fixes
are enabled. [`.github/dependabot.yml`](../.github/dependabot.yml) also opens one
grouped npm version-update PR and one grouped GitHub Actions update PR each
month. These PRs receive no bypass from the normal verification and preview
requirements.

Use this recurring owner checklist for checks that cannot safely be automated:

| Cadence | Check |
| --- | --- |
| Monthly | Review grouped Dependabot PRs and the latest production-smoke run; merge dependency updates only after the required verification check passes |
| Quarterly | Complete owner login/deep-link/logout checks, inspect the GitHub App installation and `main` ruleset, and exercise a disposable travel or roll publish to `main` |
| Every six months | Restore and compare a sample full-resolution scan from the off-site backup; review GitHub sessions, authorized Apps, Netlify environment access, DNS, and TLS |
| Annually or after suspected exposure | Exercise the session/client-secret rotation runbooks, then complete a fresh login and disposable publish test |
| After publishing or infrastructure changes | Run the relevant checks below immediately rather than waiting for the next interval |

The equivalent manual credential-free commands remain useful during incident
response:

```sh
# DNS
dig +short CNAME admin.bjsmith.xyz
dig +short CNAME travel.bjsmith.xyz

# Travel compatibility redirect
curl -sSI 'https://travel.bjsmith.xyz/test-path?gate=1'
curl -sSIL 'https://travel.bjsmith.xyz/' | grep -Ei '^(HTTP|location:)'

# Admin indexing and headers
curl -sSI https://admin.bjsmith.xyz/
curl -sS https://admin.bjsmith.xyz/robots.txt
curl -sS -D - https://admin.bjsmith.xyz/.netlify/functions/auth-me
```

Expected DNS targets are `beekadmin.netlify.app.` and
`beek-log.netlify.app.`. Travel redirects permanently to the corresponding
`https://bjsmith.xyz/travel/` path. Robots disallows `/`.

Authentication itself requires browser checks because the implementation agent
must not receive owner credentials:

- owner login reaches the dashboard and logout returns to the signed-out shell
- a protected deep link returns to its validated path after login
- a different GitHub account receives the safe not-allowed result and no
  session
- browser cookie tools show the expected `__Host-` attributes without copying
  the value

## Secret rotation

### Session secret

1. Generate `openssl rand -hex 32` locally.
2. Replace `SESSION_SECRET` in the admin Netlify environment.
3. Redeploy production.
4. Confirm existing sessions are rejected and the owner can sign in again.
5. Delete any temporary local copy. Rotation intentionally logs out everyone.

### GitHub App client secret

1. In GitHub **Settings → Developer settings → GitHub Apps**, open App ID
   `4466745`.
2. Generate a new client secret without deleting the active one.
3. Replace `GITHUB_CLIENT_SECRET` in Netlify and redeploy.
4. Complete a fresh login and `auth-me` check.
5. Revoke/delete the old GitHub secret only after the new one works.

### Suspected token or cookie compromise / incident logout

1. Rotate `SESSION_SECRET` immediately and redeploy the admin. This is the
   system-wide incident-logout mechanism because sessions are stateless.
2. Revoke the affected GitHub App user authorization from GitHub account
   settings. If the account itself may be compromised, revoke all App sessions.
3. Rotate the GitHub client secret if it may be exposed.
4. Review GitHub audit/security history, `admin/*` branches, commits and pull
   requests. Close unknown PRs before deleting their branches.
5. Review Netlify deploys and environment-variable changes.
6. Keep publishing disabled until the cause is understood; a temporary invalid
   `OAUTH_ALLOWED_USERS` value can fail closed while preserving the site.
7. Restore the exact owner allow-list, redeploy, and complete login plus a
   disposable abandon test before resuming publication.

## OAuth recovery

1. Confirm the GitHub App still exists, expiring user tokens remain enabled,
   and its installation selects only `bjsmithxyz/beek-log`.
2. Confirm its callback is exactly
   `https://admin.bjsmith.xyz/.netlify/functions/auth-callback`.
3. Confirm Netlify's `ADMIN_SITE_URL`, `GITHUB_CLIENT_ID`, repository ID, and
   allow-list match the production inventory. Never print secret values.
4. If code exchange fails, create a second GitHub client secret, replace the
   Netlify value, redeploy, and test before revoking the old secret.
5. Clear only the admin origin's cookies and restart login; stale OAuth state is
   intentionally rejected rather than recovered.
6. If refresh repeatedly fails, revoke the App's user authorization and perform
   a new authorization. Do not disable token expiry or introduce a broad OAuth
   scope as a workaround.

## Owner-account security boundary

The allowed GitHub owner account is the final authorization boundary. Protect it
with WebAuthn hardware-key 2FA, ideally two independently stored keys. Keep
GitHub recovery codes offline in the owner's password/recovery system; never
record key identifiers, recovery codes, passwords, or secret-storage locations
in this repository. Review GitHub sessions and authorized Apps periodically.

## DNS or TLS recovery

- `admin` must CNAME to `beekadmin.netlify.app` and be attached to the admin
  Netlify site.
- `travel` must CNAME to `beek-log.netlify.app` and be attached to the public
  Netlify site.
- Do not use registrar web forwarding.
- The public HSTS policy includes subdomains; wait for Netlify to report an
  active certificate before directing a custom subdomain to a replacement site.
- If travel rollback is required before the old site is retired, reattach its
  custom alias and point the CNAME back to `longwayround.netlify.app`.

## Full-resolution scan archive

The repository and public site contain only the web derivatives (maximum 2048px
long edge), not the archival originals. The owner retains the full-resolution
scans in two places:

- the owner's personal endpoint as the primary working/archive copy
- Proton Drive as the independent off-site cloud copy

Do not record endpoint addresses, account details, paths, encryption material,
or recovery credentials here. A repository clone is not a substitute for either
archive. Periodically restore a sample scan from Proton Drive and compare it to
the primary copy before treating the backup as healthy.

## `main` pull-request ruleset

Active ruleset `main: PR + CI (admin may bypass)` (ID `20260621`) targets the
default branch. It requires a PR with zero approvals, resolved review threads,
and the `Project verification` GitHub Actions check for non-bypass actors. The
repository **Admin** role may bypass so the hosted admin (acting as the owner
OAuth session) can fast-forward content commits onto `main`. A second ruleset
blocks force-pushes and branch deletion with no bypass.

Code, docs, and Dependabot changes should still use pull requests. Content
publishes from the hosted admin commit directly to `main`; production Netlify
builds and `Project verification` on push remain the post-commit safety net.

Recreation procedure:

1. Open **Settings → Rules → Rulesets → New branch ruleset**.
2. Name it `main: PR + CI (admin may bypass)`; set enforcement to **Active**.
3. Target the default branch (`main`) only.
4. Enable **Require a pull request before merging**, with zero required external
   approvals for this single-owner repository. Keep conversation resolution
   required if GitHub offers it without blocking comment-free PRs.
5. Add the GitHub Actions status check named `Project verification` as a
   required status check. Keep strict status-check policy disabled.
6. Add the repository **Admin** role as a bypass actor (`always`) so owner
   content publishes can update `main` without a PR.
7. Keep a separate active ruleset that blocks force pushes and branch deletion
   with no bypass actors.
8. Save, then verify a non-admin direct push to `main` is rejected and an
   authenticated admin publish can update `main`.

Emergency removal of the Admin bypass requires a deliberate temporary ruleset
change, which should be documented in the incident record and reverted
immediately.

## Legacy travel retirement

`travel.bjsmith.xyz` now CNAMEs to `beek-log.netlify.app` and redirects to the
public `/travel/` route; it no longer depends on the legacy repository or
Netlify project. On 2026-08-03 the owner disabled the legacy GitHub Pages site,
archived `bjsmithxyz/long-way-round`, and deleted the old Netlify project after
confirming it owned no custom domain. Post-change checks:

```sh
curl -sSI https://travel.bjsmith.xyz/
curl -sSIL https://travel.bjsmith.xyz/ | grep -Ei '^(HTTP|location:)'
curl -sS -o /dev/null -w '%{http_code}\n' https://longwayround.netlify.app/
```

Verified result: travel still redirects and finishes at HTTP 200; both the
legacy GitHub Pages URL and deleted default Netlify hostname return HTTP 404.

## Verified baseline — 2026-08-02

Owner-operated checks confirmed allowed login/logout and server-side rejection
of a second GitHub account. Independent unauthenticated checks confirmed:

- valid admin TLS and both expected CNAMEs
- HTTP 401 from signed-out `auth-me`
- HTTP 302 from protected admin routes to a validated local `next` path
- complete SSR and Function security headers
- disallow-all admin robots policy
- travel path/query-preserving 301 and final `/travel/` HTTP 200

The implementation tests at the Phase 2 gate were 71/71 passing, and both
public and admin Astro builds passed.

## Phase 3 live publication evidence

PR [#8](https://github.com/bjsmithxyz/beek-log/pull/8) was created by the
hosted travel editor on 2026-08-02 from branch
`admin/travel/3d1a13c6-7222-4bc0-beeb-58b268e80011`. The marked PR produced a
working public Deploy Preview, was merged separately from the admin, and the
publishing branch was deleted. Independent checks confirmed:

- the PR body carries the `beek-admin:publication:v1` marker
- the PR was authored by `bjsmithxyz`, based on `main`, and merged as commit
  `46e85bc01ea2c0576ad534eff1db8e23d75533ba`
- `https://deploy-preview-8--beek-log.netlify.app/` returns HTTP 200
- the production travel bundle contains the merged itinerary change
- the repository branch list contains only `main` after merge

PR [#9](https://github.com/bjsmithxyz/beek-log/pull/9) then proved the abandon
path. It was created from
`admin/travel/8122e84b-7541-4d98-b952-e72e0be46e52`, produced an HTTP 200
Deploy Preview, and was closed without merging. Independent checks confirmed
that the branch was deleted, only `main` remained, and its disposable marker
never appeared in the production itinerary.

Together these checks prove the production branch → PR → preview → merge and
abandon paths. Phase 3 closed with 95 full-suite tests, 35 admin tests, both
builds passing, and phone/desktop editor checks accepted.

## Phase 4 live roll evidence

PR [#10](https://github.com/bjsmithxyz/beek-log/pull/10) was created by the
hosted roll editor on 2026-08-03 from branch
`admin/rolls/f2ee7d5d-0e84-4c91-aebe-a60bf7fe27d2`. Its Deploy Preview was
reviewed and the admin merged it as commit
`6bf1e8b39a0acb7ef4c604fffe47919eab3f3593`; the publishing branch was then
deleted. It added the real Bukhara / Khiva roll with one Markdown file and 33
sequential JPEGs. Independent checks confirmed:

- production serves the roll and lists 20 committed rolls
- Markdown preserves Bukhara as the primary location, Khiva frame overrides,
  and Uzbekistan as the shared region
- all 33 assets are valid JPEGs with a maximum long edge of 2048px
- the first failed publication attempts created neither a PR nor branch and did
  not change `main`
- the full suite passes 113 tests and the production public build succeeds

PR [#11](https://github.com/bjsmithxyz/beek-log/pull/11) then updated that roll
through a reviewed Deploy Preview and merged as
`15c3a187093a83873ea17200f33f613551273719`. It moved the former frame 16 to
frame 33 and changed its inherited location while preserving 33 sequential
paths. The before/after image-blob multisets were identical, proving the editor
reused every existing image without uploading or re-encoding it. The publishing
branch was deleted after merge.

PR [#12](https://github.com/bjsmithxyz/beek-log/pull/12) created a one-frame
draft disposable roll. PR #13 correctly planned deletion of only its Markdown
and JPEG, but Netlify canceled the preview because its cached-commit comparison
matched the resulting source tree. It was abandoned without merge. The public
build-ignore rule now always builds pull requests, with a regression test.
PR [#14](https://github.com/bjsmithxyz/beek-log/pull/14) then produced a working
deletion preview: `/photos/` returned 200 without the marker and the deleted roll
returned 404. It merged as `920fb5d9124849d63e9fff25a57e76c802f1b4ba`,
removed both files, and deleted its branch.

These checks complete Phase 4. The localhost direct-to-`main` publisher was
retired only after this production acceptance.

## Final Phase 5 verification — 2026-08-03

- 96 full-suite tests and 53 admin-focused tests pass after removing the retired
  localhost tests.
- Public and admin production builds pass.
- Lighthouse accessibility audits score 100 on the homepage, the 33-frame
  Bukhara / Khiva roll, and `/travel/` after correcting muted-text contrast and
  hidden-overlay focusability.
- Keyboard checks confirm the mobile menu removes hidden links from tab order,
  the lightbox opens from Enter/Space, traps controls, closes with Escape, and
  restores focus to its originating frame.
- Public and admin origins retain their intended CSP, HSTS, frame denial, and
  content-type protections; the signed-out admin identity endpoint returns 401.
- PR #14 proves the final hosted deletion path, and PR #15 proves ordinary
  repository maintenance can merge through the active PR-only ruleset.
- The final dependency audit reports zero vulnerabilities. Netlify's transitive
  image tooling is constrained to the patched project Sharp version, and the
  obsolete Lighthouse plugin/browser dependency chain was removed.
- A tracked-file signature scan found no private keys, GitHub tokens, session
  secrets, or non-example environment files. Live mutation checks still enforce
  method → content type → same origin → session before endpoint processing.

Phases 0–6 of this roadmap are complete; the R2 document remains a
specification, not an implemented migration.
