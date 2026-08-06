# Deployment

Two **Netlify** sites watch this repository:

- public: repo root, configured by `netlify.toml`
- admin: repository-root base plus `admin/` package directory, configured by
  `admin/netlify.toml` (the root base is required for npm workspace resolution)

Build-ignore on the admin site skips public content commits. The public site
always builds: a path-based skip could cancel an in-progress content deploy
when a later admin-only push arrived and then skip itself, leaving production
stuck. `.github/workflows/refresh-travel.yml` also POSTs the public Netlify
build hook on main pushes that touch public paths (and nightly for travel
"here now"), so a missed git webhook still rebuilds. Changes under `shared/`
or the workspace lockfile rebuild admin as well.

## Admin deployment

The production admin is `https://admin.bjsmith.xyz` with Netlify hostname
`beekadmin.netlify.app`. Netlify uses the repository root as its base and
`admin` as its package directory.

The admin is SSR and requires the variables in `admin/.env.example`, configured
on the admin Netlify site only. It uses a GitHub App installed solely on
`bjsmithxyz/beek-log`; user-to-server tokens are sealed into a 24-hour host-only
cookie and refreshed before their eight-hour expiry. The admin configuration
sets `noindex`, a disallow-all `robots.txt`, `no-store`, frame denial and a CSP
with self-hosted scripts only. Phase 4 adds `'wasm-unsafe-eval'` solely for the
admin MozJPEG worker plus image sources for GitHub roll previews and OpenStreetMap
tiles; the public policy is unchanged. Netlify static header rules do not cover SSR
or Function responses, so `admin/src/server/headers.mjs` applies the same policy
at the response source.

Because the public HSTS policy includes subdomains, `admin.bjsmith.xyz` must
have a valid Netlify certificate before its DNS record or public header link is
activated.

## Security headers

`netlify.toml` sets, on all routes:

- **Content-Security-Policy** — `default-src 'self'` with `'unsafe-inline'`
  for Astro's theme bootstrap, ClientRouter, and scoped styles (static Netlify
  headers cannot issue per-request nonces). XSS is contained at the content
  layer: travel JSON escapes `<`, markdown HTML is rehype-sanitized, and work
  `liveUrl`/`repoUrl` values must be `http(s)`. `font-src 'self'` works because
  fonts are self-hosted.
- **Strict-Transport-Security** — `max-age=31536000; includeSubDomains`.
- **Permissions-Policy** — camera/microphone/geolocation/browsing-topics denied.
- **X-Frame-Options**, **X-Content-Type-Options**, **Referrer-Policy**.

The single site-wide policy also allows CARTO tiles in `img-src`, which only the
travel route uses. (`connect-src` is now bare `'self'`: the Open-Meteo grant went
with the `road-ahead/` tab, which the travel privacy split removed — see
`docs/architecture.md`.) This previously sat in a route-specific `/travel` rule,
but a route-scoped CSP cannot survive `ClientRouter`: it swaps documents without
a navigation, so the browser keeps enforcing whichever policy the first-loaded
page carried. Reaching `/travel/` from an internal link therefore blocked every
tile while a direct load worked — the narrower policy bought no real protection
and broke the page.
`scripts/netlify-config.test.mjs` fails the build if a route-scoped CSP returns,
or if the policy stops covering an origin `travel-client.js` requests.

`travel.bjsmith.xyz/*` has an explicit host-specific 301 to
`bjsmith.xyz/travel/:splat`; the full destination is intentional so Netlify
does not drop the `/travel` prefix.

## Caching

Hashed build assets under `/_assets/*` are served `immutable` with a one-year
`max-age`. HTML keeps Netlify's default revalidation.

## Monitoring

Netlify Observability provides the Free plan's rolling 24-hour request view and
requires no site code. Accessibility release gates use a current local
Lighthouse/Chrome run against the homepage, an image-heavy roll, and `/travel/`.
The former Netlify Lighthouse plugin was removed because its pinned browser
tooling accumulated advisories; do not restore it without checking its full
dependency audit.

## Gotchas

- **Do not add a `/* -> /404.html` redirect** to `netlify.toml`. Netlify serves
  `404.html` for unmatched routes automatically, and the explicit rule breaks
  dev-server routing under the Netlify adapter (it makes `astro dev` 404 any
  route not present in the last `dist` build).
- Do not restore the retired localhost publisher or any direct-to-`main`
  authoring path; hosted mutations must pass through a reviewed PR.

## Upgrades

`astro` (7) and `@astrojs/netlify` (8) are on their current majors. The site
retains the Netlify adapter so Astro's `<Image />` component uses Netlify Image
CDN transformations in production. Astro 7 requires Node ≥ 22.12; this project
requires Node ≥ 22.18 for its test suite.

The root npm override makes Netlify's transitive `ipx` use the same patched
Sharp release as Astro and the maintenance scripts. Remove the override only
when `@netlify/images` natively permits that Sharp line. `npm audit` is clean as
of the final 2026-08-03 review. Do not use `npm audit fix --force`; review and
test dependency changes through a pull request.
