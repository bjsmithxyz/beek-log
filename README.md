# bjsmith.xyz

Personal site of **beek** — a place to put development work, art, film
photography, and travel. The npm-workspace repo contains a static public Astro
site, an isolated Astro SSR admin, and pure authoring modules under `shared/`.

## Quick start

```sh
npm install
npm run dev      # http://localhost:4321
npm run build    # public production build → ./dist/

npm run dev --workspace @beek/admin
npm test --workspace @beek/admin
npm run build --workspace @beek/admin
```

## Documentation

Detailed, technical docs live in [docs/](docs/README.md):

- [Architecture](docs/architecture.md) — stack, project structure, content collections, the photos map
- [Development](docs/development.md) — local setup, authoring content, commands, tests
- [Photography](docs/photography.md) — the `/photos` section and hosted roll-publishing workflow
- [Images & assets](docs/images-and-assets.md) — image compression, the Netlify Image CDN, asset generators
- [Deployment](docs/deployment.md) — Netlify, security headers, caching, gotchas

## Deployment

The public and admin Netlify sites watch the same repository with independent
package/configuration paths and build-ignore rules. See
[docs/deployment.md](docs/deployment.md).
