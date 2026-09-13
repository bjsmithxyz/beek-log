# Admin operations

Deployed admin topology and routine owner operations. Recreate from scratch with
[`admin-infrastructure-setup.md`](admin-infrastructure-setup.md).

## Production inventory

| Resource | Value |
| --- | --- |
| Public origin | `https://bjsmith.xyz` (`beek-log.netlify.app`) |
| Travel host | `travel.bjsmith.xyz` → `beek-log.netlify.app` → `/travel/` |
| Admin origin | `https://admin.bjsmith.xyz` (`beekadmin.netlify.app`) |
| Admin package directory | `admin` (repo root is the base) |
| GitHub repository | `bjsmithxyz/beek-log` (ID `1147572483`) |
| GitHub App | ID `4466745`, Client ID `Iv23li0ooi4MWMFc4MpI` |
| Allowed GitHub login | `bjsmithxyz` |

App ID and Client ID are public identifiers. The client secret, session secret,
OAuth tokens, and cookie values must never be recorded here. No App private key
is used.

## Netlify layout

Both sites use the same repo and `main` branch, and always rebuild on push; the
publisher and Actions also POST the public build hook so rolls ship without
waiting on runners.

- Public: root `netlify.toml`, static `dist/`.
- Admin: root base, `admin` package dir, `admin/netlify.toml`, SSR `admin/dist/`,
  functions in `admin/netlify/functions/`.

Admin environment keys: `ADMIN_SITE_URL`, `GITHUB_CLIENT_ID`,
`GITHUB_CLIENT_SECRET`, `GITHUB_REPOSITORY_ID`, `OAUTH_ALLOWED_USERS`,
`SESSION_SECRET`, `NETLIFY_BUILD_HOOK` (public build-hook URL; without it rolls
still commit but may wait on the git trigger). On plans without production-only
Function scoping, keep Netlify's **Require approval** policy for untrusted
deploys and never approve an outside Deploy Preview before reviewing its code.

## Authentication model

`auth-login` seals state + PKCE verifier into a short-lived cookie and redirects
to GitHub. `auth-callback` verifies state, exchanges the code, and checks the
single-user allow-list server-side. The user + refresh tokens are sealed with
AES-256-GCM in `__Host-beek_session` (no session DB): Secure, HttpOnly, SameSite
Lax, host-only, path `/`, 24-hour absolute lifetime. GitHub tokens refresh before
their ~8-hour expiry without extending that lifetime. The App is installed only
on `bjsmithxyz/beek-log` with **Contents** read/write (no Pull requests).

Source: `admin/src/server/auth.mjs`; tests `admin/test/auth*.test.mjs`.

## Publishing endpoints

All data endpoints require an owner session; mutations also require POST JSON and
a matching admin Origin before their strict schemas.

| Function | Purpose |
| --- | --- |
| `travel-data` | Load/validate `trips.json` + blob SHA |
| `publish-start` | Validate travel data, commit to `main` |
| `rolls-data` / `roll-data` | Load guarded roll inventories/Markdown |
| `blob-upload` | Store one encoded JPEG as an unreferenced Git blob |
| `publish-roll` | Map strict create/edit/rename/delete input to allowed paths, commit to `main` |
| `geocode` | Throttled same-origin location/country proxy |

The browser never chooses a path — travel maps to `trips.json`, rolls to one
Markdown path + sequential `NNN.jpg`. Stale-SHA and complete-inventory checks
prevent overwriting newer edits or orphaning frames; `.`/`..` segments are
rejected before the allowlist. A client UUID tags the commit so retries return
the prior commit rather than writing twice. Image blobs stay dangling until
linked and are rate-limited (as are publish endpoints); JPEG magic bytes are
verified before attaching; commit/roll titles reject control chars.

Source: `publisher.mjs`, `request-guards.mjs`, `travel-publish.mjs`; tests
`publisher.test.mjs`, `publish-functions.test.mjs`, `travel-*.test.mjs`.

## Security headers

`admin/netlify.toml` covers static assets; `admin/src/server/headers.mjs` applies
the full policy to SSR/Function responses (Netlify static rules don't). Keep both
layers. Signed-out spot check:

```sh
curl -sSI https://admin.bjsmith.xyz/
curl -sS -D - -o /dev/null https://admin.bjsmith.xyz/.netlify/functions/auth-me
```

Expect no-store, noindex, script-src self only, frame denial, COOP/CORP, nosniff,
referrer + permissions policy, HSTS; `auth-me` is 401 while signed out.

## Routine verification

The credential-free suite runs Mondays in
[`production-smoke.yml`](../.github/workflows/production-smoke.yml) or via
`npm run test:live` — it checks both CNAMEs, public routes, the travel redirect,
the admin robots policy, and signed-out identity + headers. Actions failures are
the alert; add no secrets to it. Dependabot vulnerability alerts/fixes are on, and
[`dependabot.yml`](../.github/dependabot.yml) opens one grouped npm and one
grouped Actions PR monthly (no bypass of the verification gate).

Owner checklist for what can't be automated:

| Cadence | Check |
| --- | --- |
| Monthly | Review Dependabot PRs + latest smoke run; merge deps only after `Project verification` passes |
| Quarterly | Login/deep-link/logout checks; inspect App installation + `main` ruleset; do a disposable travel/roll publish |
| Six-monthly | Restore + compare a sample full-res scan from off-site backup; review GitHub sessions, authorized Apps, Netlify env access, DNS, TLS |
| Annually / after suspected exposure | Run the rotation runbooks below, then a fresh login + disposable publish |

Manual credential-free commands (also useful in incidents):

```sh
dig +short CNAME admin.bjsmith.xyz          # → beekadmin.netlify.app.
dig +short CNAME travel.bjsmith.xyz         # → beek-log.netlify.app.
curl -sSI 'https://travel.bjsmith.xyz/test-path?gate=1'   # 301 → /travel/test-path
curl -sSIL 'https://travel.bjsmith.xyz/' | grep -Ei '^(HTTP|location:)'  # ends 200
curl -sSI https://admin.bjsmith.xyz/
curl -sS https://admin.bjsmith.xyz/robots.txt              # Disallow: /
curl -sS -D - https://admin.bjsmith.xyz/.netlify/functions/auth-me
```

Auth itself needs browser checks (the implementation agent must not hold owner
credentials): owner login reaches the dashboard and logout returns to the
signed-out shell; a protected deep link returns to its validated path; a
different account gets the safe not-allowed result and no session; cookie tools
show the `__Host-` attributes without copying the value.

## Secret rotation

**Session secret:** `openssl rand -hex 32` → replace `SESSION_SECRET` in Netlify
→ redeploy → confirm old sessions are rejected and owner can sign in → delete the
local copy. (Rotation logs everyone out — this is the incident-logout mechanism,
since sessions are stateless.)

**GitHub App client secret:** in the App (ID `4466745`), generate a new client
secret without deleting the active one → replace `GITHUB_CLIENT_SECRET` →
redeploy → fresh login + `auth-me` → revoke the old secret only after the new one
works.

**Suspected compromise:** rotate `SESSION_SECRET` and redeploy immediately;
revoke the affected GitHub App user authorization; rotate the client secret if it
may be exposed; review GitHub audit history, `admin/*` branches, commits, and
PRs; review Netlify deploys and env changes. Keep publishing disabled until
understood (a temporary invalid `OAUTH_ALLOWED_USERS` fails closed while
preserving the site), then restore the allow-list, redeploy, and test.

## OAuth recovery

Confirm the App exists with expiring user tokens enabled and installed only on
`beek-log`; callback is exactly
`https://admin.bjsmith.xyz/.netlify/functions/auth-callback`; Netlify's
`ADMIN_SITE_URL`, `GITHUB_CLIENT_ID`, repo ID, and allow-list match the inventory.
If code exchange fails, rotate the client secret (above). Clear only the admin
origin's cookies and restart login — stale state is rejected, not recovered. If
refresh repeatedly fails, revoke and re-authorize; never disable token expiry or
broaden OAuth scope as a workaround.

## Owner-account boundary

The allowed GitHub owner account is the final authorization boundary. Protect it
with WebAuthn hardware-key 2FA (ideally two keys), keep recovery codes offline,
and record no key IDs/recovery codes/secret locations in this repo. Review
sessions and authorized Apps periodically.

## DNS / TLS recovery

- `admin` CNAMEs to `beekadmin.netlify.app` (admin site); `travel` CNAMEs to
  `beek-log.netlify.app` (public site) and 301s to `/travel/`. No registrar web
  forwarding.
- Public HSTS includes subdomains — wait for an active Netlify certificate before
  pointing a custom subdomain at a replacement site.
- The legacy `long-way-round` travel site was retired (2026-08-03); if a travel
  rollback is ever needed before a replacement is retired, reattach its alias and
  point the CNAME back to `longwayround.netlify.app`.

## Full-resolution scan archive

The repo and site hold only web derivatives (≤2048px). The owner keeps the
full-res scans in two places (a personal working endpoint + Proton Drive as
off-site); record no addresses, accounts, paths, or credentials here. A clone is
not a substitute. Periodically restore a sample and compare before trusting the
backup.

## `main` pull-request ruleset

Active ruleset `main: PR + CI (admin may bypass)` (ID `20260621`) requires a PR
(zero approvals), resolved threads, and the `Project verification` check for
non-bypass actors. The repo **Admin** role may bypass so the hosted admin (owner
OAuth session) can fast-forward content commits. A second ruleset blocks
force-pushes and branch deletion with no bypass. Code/docs/Dependabot changes
still use PRs.

Recreate: **Settings → Rules → Rulesets → New branch ruleset**; name it as above,
enforcement **Active**, target `main`; require a PR (zero approvals, keep thread
resolution if it doesn't block comment-free PRs); add `Project verification` as a
required status check (strict off); add the **Admin** role as an `always` bypass
actor; keep the separate no-bypass force-push/deletion ruleset. Verify a non-admin
push to `main` is rejected and an admin publish succeeds. Emergency removal of the
Admin bypass must be documented in the incident record and reverted immediately.

## History

Phases 0–6 of the admin build are complete; acceptance evidence (live publish/
abandon/delete paths, dated verification baselines) lives in git history and PRs
[#8](https://github.com/bjsmithxyz/beek-log/pull/8)–[#15](https://github.com/bjsmithxyz/beek-log/pull/15).
The localhost direct-to-`main` publisher was retired after production acceptance.
The R2 document ([`image-storage-migration.md`](image-storage-migration.md))
remains a specification, not an implemented migration.
