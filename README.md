# bjsmith.xyz

Personal site of **beek** — a place to put development work, art, and film
photography. Built with [Astro 5](https://astro.build) in a terminal /
file-browser aesthetic, and hosted on Netlify.

## Quick start

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # production build → ./dist/
```

## Documentation

Detailed, technical docs live in [docs/](docs/README.md):

- [Architecture](docs/architecture.md) — stack, project structure, content collections, the photos map
- [Development](docs/development.md) — local setup, authoring content, commands, tests
- [Photography](docs/photography.md) — the `/photos` section and the roll-import admin (`npm run admin`)
- [Images & assets](docs/images-and-assets.md) — image compression, the Netlify Image CDN, asset generators
- [Deployment](docs/deployment.md) — Netlify, security headers, caching, gotchas

## Deployment

Any push to `main` triggers a Netlify build and deploy. See
[docs/deployment.md](docs/deployment.md).
