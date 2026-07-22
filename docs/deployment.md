# Deployment

The site is hosted on **Netlify**. Any push to `main` triggers a build
(`npm run build`) and deploy. Configuration lives in `netlify.toml` and
`astro.config.mjs`.

## Security headers

`netlify.toml` sets, on all routes:

- **Content-Security-Policy** — `default-src 'self'` with `'unsafe-inline'`
  allowed for scripts and styles (Astro inlines its theme/view-transition
  scripts and small stylesheets; the site is fully static with no user input, so
  the residual XSS surface is negligible). `font-src 'self'` works because fonts
  are self-hosted.
- **Strict-Transport-Security** — `max-age=31536000; includeSubDomains`.
- **Permissions-Policy** — camera/microphone/geolocation/browsing-topics denied.
- **X-Frame-Options**, **X-Content-Type-Options**, **Referrer-Policy**.

## Caching

Hashed build assets under `/_assets/*` are served `immutable` with a one-year
`max-age`. HTML keeps Netlify's default revalidation.

## Monitoring

Netlify Observability provides the Free plan's rolling 24-hour request view and
requires no site code. The Lighthouse build plugin reports mobile scores for
the homepage and one image-heavy photo roll after each deploy. It is
reporting-only: scores do not block releases. Keep the audit set small because
each route adds build time and consumes build credits.

## Gotchas

- **Do not add a `/* -> /404.html` redirect** to `netlify.toml`. Netlify serves
  `404.html` for unmatched routes automatically, and the explicit rule breaks
  dev-server routing under the Netlify adapter (it makes `astro dev` 404 any
  route not present in the last `dist` build).
- The roll-import admin (`scripts/admin/`) is intentionally **not** part of the
  Astro build, so it never reaches `dist/` and never deploys.

## Upgrades

`astro` (7) and `@astrojs/netlify` (8) are on their current majors. The site
retains the Netlify adapter so Astro's `<Image />` component uses Netlify Image
CDN transformations in production. Astro 7 requires Node ≥ 22.12; this project
requires Node ≥ 22.18 for its test suite.

`npm audit` reports advisories in transitive dependencies of the current Netlify
adapter and its local development tooling. npm's suggested remediation is an
incompatible downgrade of the adapter, so do not use `npm audit fix --force`;
upgrade when Netlify publishes compatible patched dependencies.
