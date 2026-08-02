# Admin infrastructure setup

This is the owner-operated setup gate between Phase 2 and Phase 3 of the unified
admin project. It creates no new server: Netlify hosts Astro SSR and four
functions, while a narrowly installed GitHub App provides user-to-server OAuth.

Do not put a client secret, session secret, OAuth token, cookie value or private
key in this repository, a GitHub issue, chat, screenshot or deploy log.

Official references:

- [Netlify monorepos](https://docs.netlify.com/build/configure-builds/monorepos/)
- [Netlify external DNS](https://docs.netlify.com/manage/domains/configure-domains/bring-a-domain-to-netlify/)
- [Netlify HTTPS](https://docs.netlify.com/manage/domains/secure-domains-with-https/https-ssl/)
- [Registering a GitHub App](https://docs.github.com/en/apps/creating-github-apps/registering-a-github-app/registering-a-github-app)
- [Installing your own GitHub App](https://docs.github.com/en/apps/using-github-apps/installing-your-own-github-app)

## Values used by this project

| Setting | Value |
| --- | --- |
| Repository | `bjsmithxyz/beek-log` |
| Production branch | `main` |
| Netlify base directory | repository root (leave Base directory empty) |
| Netlify package directory | `admin` |
| Admin config | `admin/netlify.toml` |
| Admin build command | `npm run build --workspace @beek/admin` |
| Admin publish directory | `admin/dist` |
| Admin functions directory | `admin/netlify/functions` |
| Admin URL | `https://admin.bjsmith.xyz` |
| OAuth callback | `https://admin.bjsmith.xyz/.netlify/functions/auth-callback` |
| GitHub repository ID | `1147572483` |
| Allowed GitHub login | `bjsmithxyz` |

**Important:** do not set Netlify's Base directory to `admin`. The npm workspace
and lockfile are at the repository root. Set **Package directory** to `admin`
instead; that is also how Netlify discovers `admin/netlify.toml`.

## 1. Record the public site's Netlify hostname

1. Sign in to Netlify and open the site whose primary domain is
   `bjsmith.xyz`.
2. Open **Domain management → Production domains** (older UI labels may say
   **Site configuration → Domain management**).
3. Find the site's default domain ending in `.netlify.app`.
4. Record that hostname without `https://` or a trailing slash. It is safe to
   share; it is not a credential.

Evidence:

- [ ] Public hostname recorded: `____________________.netlify.app`

## 2. Create the admin Netlify site

1. In the Netlify team containing the public site, select **Add new project →
   Import an existing project**.
2. Choose **GitHub** and authorize Netlify if prompted.
3. Select `bjsmithxyz/beek-log`.
4. Configure the project:
   - production branch: `main`
   - base directory: leave empty / repository root
   - package directory: `admin`
   - build command: `npm run build --workspace @beek/admin`
   - publish directory: `admin/dist`
5. If Netlify reads `admin/netlify.toml`, the command and publish directory may
   already be populated. Keep the values from the table above.
6. Choose a unique project name. This determines the temporary
   `<name>.netlify.app` hostname but does not affect the custom domain.
7. Select **Deploy project**.
8. Open the first deploy log and confirm all of the following:
   - the configuration file is `admin/netlify.toml`
   - the command is `npm run build --workspace @beek/admin`
   - output is `admin/dist`
   - Astro reports `output: "server"`
   - Netlify generates the Astro SSR function
9. If the public root site builds instead, stop and correct the site's build
   settings: Base directory empty, Package directory `admin`, then retry.
10. Record the default `.netlify.app` hostname from **Domain management →
    Production domains**.

The initial site may render the signed-out shell, but OAuth cannot succeed until
the GitHub App and environment variables are configured.

Evidence:

- [ ] Admin build succeeded from the correct package
- [ ] Admin hostname recorded: `____________________.netlify.app`

## 3. Attach `admin.bjsmith.xyz` and wait for TLS

The public site sends HSTS with `includeSubDomains`. Do not open the admin custom
domain in a browser until Netlify shows a valid certificate.

1. On the new admin Netlify site, open **Domain management → Production
   domains**.
2. Select **Add a domain** / **Add a domain you already own**.
3. Enter `admin.bjsmith.xyz` and confirm it as a domain alias for this site.
4. In GoDaddy, open **Domain Portfolio → bjsmith.xyz → DNS → Manage DNS**.
5. Add a DNS record:
   - type: `CNAME`
   - name/host: `admin`
   - value/points to: the admin site's `.netlify.app` hostname
   - TTL: 600 seconds if available, otherwise the default
6. Do not enter `https://`, a path or a trailing slash. Do not use GoDaddy web
   forwarding. Ensure no `A`, `AAAA` or second `CNAME` record also uses the
   `admin` host.
7. Return to Netlify and use **Verify DNS configuration** if shown.
8. Wait for **Domain management → HTTPS** to show that the Netlify/Let's Encrypt
   certificate covers `admin.bjsmith.xyz`. DNS and certificate provisioning can
   take time.
9. Only after the certificate is active, open
   `https://admin.bjsmith.xyz/`. The signed-out admin shell should load without
   a certificate warning.

Useful read-only checks:

```sh
dig +short CNAME admin.bjsmith.xyz
curl -sSI https://admin.bjsmith.xyz/
```

Evidence:

- [ ] CNAME resolves to the admin Netlify hostname
- [ ] Netlify reports an active certificate for `admin.bjsmith.xyz`
- [ ] HTTPS shell loads with no browser warning

## 4. Register the GitHub App

1. Sign in to GitHub as `bjsmithxyz`.
2. Open the avatar menu → **Settings → Developer settings → GitHub Apps**.
3. Select **New GitHub App**.
4. Enter:
   - GitHub App name: a unique name such as `beek-log-admin`
   - homepage URL: `https://admin.bjsmith.xyz/`
   - callback URL:
     `https://admin.bjsmith.xyz/.netlify/functions/auth-callback`
5. Keep **Expire user authorization tokens** enabled. GitHub user tokens expire
   after about eight hours; this project refreshes them without extending its
   24-hour absolute session.
6. Leave **Request user authorization (OAuth) during installation** off if the
   option appears. The admin starts OAuth explicitly when the owner signs in.
7. Leave Device Flow disabled.
8. This project does not consume webhooks. Clear/disable **Active** in the
   Webhook section and do not configure a webhook secret.
9. Under **Repository permissions**, set only:
   - **Contents:** Read and write
   - **Pull requests:** Read and write
   GitHub automatically grants required read-only Metadata access.
10. Leave all organization and account permissions at **No access**.
11. Under **Where can this GitHub App be installed?**, choose **Only on this
    account**.
12. Select **Create GitHub App**.
13. On the app settings page, copy the **Client ID**. It is not the numeric App
    ID and not the Client secret.
14. Select **Generate a new client secret** and copy it immediately into a
    password manager. GitHub only displays it once.
15. Do **not** generate a private key. This project uses user-to-server tokens,
    not installation tokens or JWT signing.

Evidence (never record the secret itself):

- [ ] App created with exactly Contents write + Pull requests write
- [ ] Expiring user tokens enabled
- [ ] Client ID recorded
- [ ] Client secret stored securely
- [ ] No private key generated

## 5. Install the GitHub App on one repository

1. From the GitHub App settings page, select **Install App** in the sidebar.
2. Select **Install** beside the `bjsmithxyz` account.
3. Choose **Only select repositories**.
4. Select only `beek-log`.
5. Complete **Install** / **Save**.
6. Return to the installation settings and verify that the repository list
   contains exactly `bjsmithxyz/beek-log`.

Do not choose **All repositories**. The one-repository installation is part of
the security boundary.

Evidence:

- [ ] Installation contains exactly `bjsmithxyz/beek-log`

## 6. Configure admin Netlify environment variables

1. Generate a session key locally:

   ```sh
   openssl rand -hex 32
   ```

   Copy the output directly to Netlify or a password manager. Do not add it to
   an `.env` file in the repository.
2. Open the admin Netlify site → **Project configuration → Environment
   variables**.
3. Add the following variables:

   | Variable | Value |
   | --- | --- |
   | `ADMIN_SITE_URL` | `https://admin.bjsmith.xyz` |
   | `GITHUB_CLIENT_ID` | Client ID from the GitHub App |
   | `GITHUB_CLIENT_SECRET` | generated GitHub App client secret |
   | `GITHUB_REPOSITORY_ID` | `1147572483` |
   | `OAUTH_ALLOWED_USERS` | `bjsmithxyz` |
   | `SESSION_SECRET` | output of `openssl rand -hex 32` |

4. Mark `GITHUB_CLIENT_SECRET` and `SESSION_SECRET` as secret/sensitive values
   if the UI and plan offer that option.
5. If the Netlify plan offers variable scopes and contextual values, choose
   **Functions** scope and **Production** context. On the Netlify Free plan
   these controls may be unavailable; keep the default site-variable settings
   instead. The values will then exist in trusted deploys as well as production.
6. Because this is a public repository, open **Project configuration →
   Environment variables → Site policies** and keep **Require approval** for
   untrusted deploys. Never choose **Deploy without restrictions**. Review code
   before approving an outside contributor's admin Deploy Preview.
7. Re-check spelling, capitalization and the lack of a trailing slash on
   `ADMIN_SITE_URL`.
8. Open **Deploys → Trigger deploy → Deploy site** (or retry the latest deploy)
   so the production functions receive the new environment.
9. Confirm the deploy succeeds. Never print an environment variable in the
   deploy log while troubleshooting.

Evidence:

- [ ] All six variables exist on the admin site
- [ ] Secrets use the narrowest controls available on the current plan
- [ ] Untrusted deploy policy is **Require approval**
- [ ] Production was redeployed after adding them

## 7. Move `travel.bjsmith.xyz` to the public site

This preserves the DNS record name but changes which Netlify site owns and
serves it.

1. In Netlify, open the old Long Way Round site associated with
   `longwayround.netlify.app`.
2. Open **Domain management → Production domains** and remove
   `travel.bjsmith.xyz` from that old site. Do not delete the old site yet.
3. Open the public `bjsmith.xyz` Netlify site.
4. Under **Domain management → Production domains**, add
   `travel.bjsmith.xyz` as a domain alias.
5. In GoDaddy **Manage DNS**, edit the existing `travel` CNAME:
   - keep type `CNAME`
   - keep name/host `travel`
   - change value from `longwayround.netlify.app` to the public site's
     `.netlify.app` hostname recorded in section 1
6. Save the record. Do not add a second `travel` record.
7. Return to the public Netlify site and verify DNS configuration.
8. Wait until its HTTPS certificate includes `travel.bjsmith.xyz`.
9. Verify the redirect:

   ```sh
   dig +short CNAME travel.bjsmith.xyz
   curl -sSI 'https://travel.bjsmith.xyz/test-path?gate=1'
   curl -sSIL 'https://travel.bjsmith.xyz/' | grep -Ei '^(HTTP|location:)'
   ```

   The first request should return `301` with a location beginning
   `https://bjsmith.xyz/travel/test-path`. The root request should end at a
   `200` response for `https://bjsmith.xyz/travel/`.

Evidence:

- [ ] Old site no longer owns the custom domain
- [ ] Public site lists `travel.bjsmith.xyz` as an alias
- [ ] CNAME targets the public Netlify hostname
- [ ] Certificate is active
- [ ] Host/path/query redirect is correct

## 8. Verify the authentication boundary

Use a normal browser profile for `bjsmithxyz` and a private window or separate
profile signed in to a second GitHub account.

### Allowed account

1. Visit `https://admin.bjsmith.xyz/` and select **sign in with GitHub**.
2. Authorize the GitHub App as `bjsmithxyz`.
3. Confirm return to the dashboard and that the page displays `bjsmithxyz`.
4. Open `https://admin.bjsmith.xyz/.netlify/functions/auth-me`; it should return
   JSON with `"ok":true` and `"login":"bjsmithxyz"`.
5. Sign out. Confirm the dashboard is no longer available and `auth-me` returns
   HTTP 401.

### Deep link and cookie

1. While signed out, visit `https://admin.bjsmith.xyz/rolls/new/`.
2. Confirm redirect to the sign-in page and, after sign-in, return to
   `/rolls/new/` rather than an external URL.
3. In browser developer tools, inspect the admin origin's cookies. Confirm the
   session cookie:
   - is named `__Host-beek_session`
   - has Secure and HttpOnly enabled
   - has SameSite `Lax`
   - has path `/`
   - has no Domain attribute
   - expires no later than 24 hours after issue
4. Do not copy or screenshot the cookie value.

### Disallowed account

1. Sign out of the admin.
2. In a separate browser profile signed in to a different GitHub account, visit
   the admin and select **sign in with GitHub**.
3. Confirm the callback displays a safe not-allowed error and never displays the
   dashboard.
4. Confirm `/.netlify/functions/auth-me` returns HTTP 401 in that profile.
5. Confirm no session cookie remains for the denied account.

### Headers and indexing

Run:

```sh
curl -sSI https://admin.bjsmith.xyz/
curl -sS https://admin.bjsmith.xyz/robots.txt
```

Confirm `Cache-Control: no-store`, `X-Robots-Tag: noindex, nofollow`, CSP,
`X-Frame-Options: DENY`, HSTS, and a `robots.txt` containing `Disallow: /`.
The admin must not emit a sitemap.

Evidence:

- [ ] Allowed login, refreshable session and logout work
- [ ] Protected deep link round-trips correctly
- [ ] Cookie attributes match the list above
- [ ] Second GitHub account is denied
- [ ] Security headers and robots policy are present

## 9. Information to return to the implementation agent

Share only:

- public `.netlify.app` hostname
- admin `.netlify.app` hostname
- confirmation that both custom domains have active HTTPS
- confirmation that all six admin variables are set (not their values)
- confirmation that the GitHub App is installed only on `beek-log`
- allowed-account and second-account test outcomes
- any failing HTTP status, safe error label or deploy-log line that contains no
  secret

After live verification, the implementation agent will add the public admin
link, update the root `ROADMAP.md`, record the verified infrastructure state in
project documentation, and begin Phase 3. The hosted admin must not progress to
Phase 3 before every evidence item above passes.

## Rollback

- Admin: remove the `admin` CNAME and custom domain alias; revoke/delete the
  GitHub App client secret and rotate `SESSION_SECRET`.
- Travel: point the `travel` CNAME back to `longwayround.netlify.app` and
  reattach the alias to the old site if the public-site redirect fails.
- Never delete the old travel Netlify site until the redirect has been verified.
