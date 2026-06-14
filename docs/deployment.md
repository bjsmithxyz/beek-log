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

## Gotchas

- **Do not add a `/* -> /404.html` redirect** to `netlify.toml`. Netlify serves
  `404.html` for unmatched routes automatically, and the explicit rule breaks
  dev-server routing under the Netlify adapter (it makes `astro dev` 404 any
  route not present in the last `dist` build).
- The roll-import admin (`scripts/admin/`) is intentionally **not** part of the
  Astro build, so it never reaches `dist/` and never deploys.

## Deferred upgrade

`astro` (5 → 6) and `@astrojs/netlify` (6 → 7) are held back deliberately: that
pair is a breaking migration (the legacy content-collections API the site uses
moves to the Content Layer). Tackle it as its own effort, not a drive-by bump.
