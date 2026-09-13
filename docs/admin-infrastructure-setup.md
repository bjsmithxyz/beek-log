# Admin infrastructure setup

Disaster-recovery / recreation procedure for the admin. It provisions no server:
Netlify hosts Astro SSR + auth/publish Functions, and a narrowly installed GitHub
App provides user-to-server OAuth. Current identifiers and routine operations are
in [`admin-operations.md`](admin-operations.md).

Never put a client secret, session secret, OAuth token, cookie value, or private
key in this repo, an issue, chat, screenshot, or deploy log.

References: [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/),
[external DNS](https://docs.netlify.com/manage/domains/configure-domains/bring-a-domain-to-netlify/),
[HTTPS](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/),
[registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app),
[installing your own App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app).

## Values

| Setting | Value |
| --- | --- |
| Repository / branch | `bjsmithxyz/beek-log` / `main` |
| Netlify base directory | repo root (leave **Base directory** empty) |
| Netlify package directory | `admin` |
| Admin config / build / publish | `admin/netlify.toml` / `npm run build --workspace @beek/admin` / `admin/dist` |
| Admin functions directory | `admin/netlify/functions` |
| Admin URL / OAuth callback | `https://admin.bjsmith.xyz` / `…/.netlify/functions/auth-callback` |
| GitHub repository ID / login | `1147572483` / `bjsmithxyz` |

**Do not** set Netlify's Base directory to `admin` — the workspace + lockfile are
at the repo root. Set **Package directory** to `admin` (that's also how Netlify
finds `admin/netlify.toml`).

## 1. Create the admin Netlify site

In the team with the public site: **Add new project → Import an existing project
→ GitHub → `bjsmithxyz/beek-log`**. Set production branch `main`, base empty,
package directory `admin`, build `npm run build --workspace @beek/admin`, publish
`admin/dist`. Deploy, then confirm in the log: config `admin/netlify.toml`, that
build command, output `admin/dist`, Astro `output: "server"`, and an SSR function
generated. If the root site builds instead, fix Base empty / Package `admin` and
retry. Record the `.netlify.app` hostname. The signed-out shell may render before
OAuth is configured.

## 2. Attach `admin.bjsmith.xyz` + TLS

Public HSTS includes subdomains, so don't open the admin domain until Netlify
shows a valid certificate. On the admin site: **Domain management → add a domain**
→ `admin.bjsmith.xyz`. In GoDaddy DNS add a `CNAME` `admin` → the admin
`.netlify.app` hostname (TTL 600; no `https://`/path/trailing slash; no web
forwarding; no other record on `admin`). Verify DNS in Netlify, wait for the
certificate to cover the host, then open `https://admin.bjsmith.xyz/`.

```sh
dig +short CNAME admin.bjsmith.xyz
curl -sSI https://admin.bjsmith.xyz/
```

## 3. Register the GitHub App

As `bjsmithxyz`: **Settings → Developer settings → GitHub Apps → New GitHub App**.

- Name e.g. `beek-log-admin`; homepage `https://admin.bjsmith.xyz/`; callback
  `https://admin.bjsmith.xyz/.netlify/functions/auth-callback`.
- **Keep Expire user authorization tokens enabled** (tokens ~8h; the app refreshes
  within its 24h session).
- OAuth-during-install off, Device Flow off, webhooks off (no secret).
- Repository permissions: **Contents: Read and write** only; **Pull requests: No
  access** (publishes commit straight to `main`). Metadata read is auto-granted.
- All org/account permissions **No access**; installable **Only on this account**.

Create the app. Copy the **Client ID**, generate a **client secret** (shown once
— store in a password manager). **Do not** generate a private key (this uses
user-to-server tokens).

## 4. Install on one repository

From the App page: **Install App** beside `bjsmithxyz` → **Only select
repositories** → `beek-log` only. Verify the installation lists exactly
`bjsmithxyz/beek-log`. Never choose **All repositories** — the one-repo install is
part of the security boundary.

## 5. Configure environment variables

Generate a session key with `openssl rand -hex 32` (copy straight to Netlify / a
password manager, never an `.env` in the repo). On the admin site → **Project
configuration → Environment variables**, add:

| Variable | Value |
| --- | --- |
| `ADMIN_SITE_URL` | `https://admin.bjsmith.xyz` (no trailing slash) |
| `GITHUB_CLIENT_ID` | App Client ID |
| `GITHUB_CLIENT_SECRET` | App client secret |
| `GITHUB_REPOSITORY_ID` | `1147572483` |
| `OAUTH_ALLOWED_USERS` | `bjsmithxyz` |
| `SESSION_SECRET` | `openssl rand -hex 32` output |
| `NETLIFY_BUILD_HOOK` | public build-hook URL (same as the Actions secret) |

Mark the two secrets sensitive. If the plan offers scopes/contexts, use
**Functions** scope + **Production**; on Free these may be unavailable (values
then also exist in trusted deploys). Because the repo is public, keep **Site
policies → Require approval** for untrusted deploys. Redeploy so Functions pick up
the environment; never print a variable in the log.

## 6. Verify the auth boundary

With a `bjsmithxyz` browser and a second-account private window:

- **Allowed:** sign in → dashboard shows `bjsmithxyz`; `…/auth-callback` returns;
  `…/functions/auth-me` returns `{"ok":true,"login":"bjsmithxyz"}`; sign out → the
  dashboard is gone and `auth-me` is 401.
- **Deep link:** while signed out, `…/rolls/new/` redirects to sign-in and returns
  to `/rolls/new/` after login. The cookie is `__Host-beek_session`, Secure,
  HttpOnly, SameSite Lax, path `/`, no Domain, ≤24h. Don't copy its value.
- **Disallowed:** a different account gets a safe not-allowed error, never the
  dashboard; its `auth-me` is 401 and no session cookie remains.
- **Headers/robots:** `curl -sSI https://admin.bjsmith.xyz/` and `…/robots.txt`
  show `no-store`, `X-Robots-Tag: noindex, nofollow`, CSP, `X-Frame-Options:
  DENY`, HSTS, and `Disallow: /`. No sitemap.

## Rollback

- **Admin:** remove the `admin` CNAME + custom-domain alias; revoke/delete the App
  client secret and rotate `SESSION_SECRET`.
- **Travel:** point the `travel` CNAME back to `longwayround.netlify.app` and
  reattach its alias to the old site if the public redirect fails. Never delete
  the old travel Netlify site until the redirect is verified.
