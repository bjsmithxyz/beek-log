# Deployment

Two **Netlify** sites watch this repo:

- **public** — repo root, `netlify.toml`, static `dist/`.
- **admin** — repo-root base + `admin/` package directory, `admin/netlify.toml`,
  SSR `admin/dist/` (the root base is required for npm workspace resolution).

Both always rebuild on push (path-based skips caused confusing canceled builds
during roll publishing). After each content commit the admin publisher also POSTs
the public build hook so `bjsmith.xyz` doesn't wait on runners;
`refresh-travel.yml` POSTs it too on public-path pushes and nightly.

## Admin deployment

Production admin is `https://admin.bjsmith.xyz` (Netlify hostname
`beekadmin.netlify.app`). It's SSR and requires the variables in
`admin/.env.example`, set on the admin site only. It uses a GitHub App installed
solely on `bjsmithxyz/beek-log`; user-to-server tokens are sealed into a 24-hour
host-only cookie and refreshed before their ~8-hour expiry. Config sets
`noindex`, disallow-all `robots.txt`, `no-store`, frame denial, and a self-only
CSP plus `'wasm-unsafe-eval'` (MozJPEG worker) and image sources for GitHub roll
previews and OSM tiles. Netlify static header rules don't cover SSR/Function
responses, so `admin/src/server/headers.mjs` applies the same policy at the
source. Because public HSTS includes subdomains, `admin.bjsmith.xyz` needs a
valid certificate before its DNS record or header link is activated.

## Security headers

`netlify.toml` sets, on all routes:

- **CSP** — `default-src 'self'` with `'unsafe-inline'` for Astro's theme
  bootstrap, ClientRouter, and scoped styles (static headers can't do nonces).
  XSS is contained at the content layer: travel JSON escapes `<`, markdown is
  rehype-sanitized, `liveUrl`/`repoUrl` must be `http(s)`. `img-src` also allows
  CARTO tiles (travel only); `connect-src` is bare `'self'`.
- **HSTS** — `max-age=31536000; includeSubDomains`.
- **Permissions-Policy** — camera/mic/geolocation/browsing-topics denied.
- **X-Frame-Options**, **X-Content-Type-Options**, **Referrer-Policy**.

The CSP is site-wide, not route-scoped: `ClientRouter` swaps documents without a
navigation, so a route-scoped policy would leak the first-loaded page's CSP and
break `/travel/` tiles when reached via an internal link.
`scripts/netlify-config.test.mjs` fails the build if a route-scoped CSP returns
or the policy stops covering an origin `travel-client.js` needs.

`travel.bjsmith.xyz/*` has a host-specific 301 to `bjsmith.xyz/travel/:splat`
(full destination is intentional so Netlify keeps the `/travel` prefix).

## Caching

Hashed assets under `/_assets/*` are `immutable`, one-year `max-age`. HTML keeps
Netlify's default revalidation.

## Monitoring

Netlify Observability gives the Free plan's 24-hour request view. Accessibility
gates use a local Lighthouse run against the homepage, an image-heavy roll, and
`/travel/`. The former Netlify Lighthouse plugin was removed for accumulating
advisories in its pinned browser tooling — don't restore it without a full audit.

## Gotchas

- **No `/* -> /404.html` redirect** in `netlify.toml`: Netlify serves `404.html`
  automatically, and the explicit rule breaks `astro dev` routing under the
  adapter.
- Don't restore the retired localhost publisher or any direct-to-`main` authoring
  path outside the reviewed hosted admin flow.

## Upgrades

`astro` (7) and `@astrojs/netlify` (8) are on current majors; the adapter is
retained so `<Image />` uses Netlify Image CDN transforms in production. Node
≥ 22.18 is required (test suite).

Root npm `overrides` pin shared transitive deps to patched releases:
`@astrojs/internal-helpers` (keeps Netlify's copy in step with Astro — a mismatch
here crashes the admin SSR function) and Sharp/`ipx` (one patched Sharp line
across Astro, Netlify's image tooling, and the scripts). Remove an override only
when upstream no longer needs it. Review dependency changes via PR; never
`npm audit fix --force`. Remaining `npm audit` findings are dev/build-only
(Netlify's local dev toolchain) with no upstream fix and are dismissed in
Dependabot.
