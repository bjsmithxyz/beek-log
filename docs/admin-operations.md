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
- Build-ignore commands avoid unrelated production builds; changes to shared
  workspace configuration rebuild both where necessary.

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
6. The GitHub App is installed only on `bjsmithxyz/beek-log` with Contents and
   Pull requests read/write permissions.

Source: `admin/src/server/auth.mjs`. Tests: `admin/test/auth*.test.mjs`.

## Publishing endpoints

The Phase 3 travel publisher is deployed. All repository data endpoints require
a valid owner session; mutations additionally require POST JSON and a matching
admin Origin before parsing their strict schemas.

| Function | Purpose |
| --- | --- |
| `travel-data` | Load and validate `src/data/trips.json` plus its current blob SHA |
| `publish-start` | Validate travel data, build one branch commit and open a PR |
| `publish-status` | Revalidate the marked PR and check its public Deploy Preview URL |
| `publish-merge` | Revalidate head/preview/mergeability and merge the reviewed PR |
| `publish-abandon` | Close the PR and best-effort delete its admin branch |

The browser never chooses an arbitrary repository path. Travel publishing is
server-mapped to `src/data/trips.json`; stale SHA checks prevent overwriting a
newer main-branch edit. A client-generated UUID makes network retries resumable
without duplicate PR creation. The full operation engine already supports
atomic create/update/delete sets for the Phase 4 caller.

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

### Suspected token or cookie compromise

1. Rotate `SESSION_SECRET` immediately to invalidate every sealed cookie.
2. Revoke the affected GitHub App user authorization from GitHub account
   settings.
3. Rotate the GitHub client secret if it may be exposed.
4. Review GitHub audit/security history, branches, commits and pull requests.
5. Review Netlify deploys and environment-variable changes.
6. Keep publishing disabled until the cause is understood.

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

## Verified baseline — 2026-08-02

Owner-operated checks confirmed allowed login/logout and server-side rejection
of a second GitHub account. Independent unauthenticated checks confirmed:

- valid admin TLS and both expected CNAMEs
- HTTP 401 from signed-out `auth-me`
- HTTP 302 from protected admin routes to a validated local `next` path
- complete SSR and Function security headers
- disallow-all admin robots policy
- travel path/query-preserving 301 and final `/travel/` HTTP 200

The implementation tests at this gate were 71/71 passing, and both public and
admin Astro builds passed.
