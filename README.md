# bjsmith.xyz

A portfolio website built with **Astro 5**. This project showcases development work, art, and photography with a focus on clean aesthetics and smooth user experience.

## Project Structure

```text
/
├── public/          # Static assets (favicons, etc.)
├── src/
│   ├── assets/      # Optimized images and media
│   ├── components/  # Reusable Astro components
│   ├── content/     # Content collections (Markdown files)
│   │   └── work/    # Individual project/art entries
│   ├── layouts/     # Page layouts (BaseLayout.astro)
│   ├── pages/       # Route components (index, work, about)
│   └── styles/      # Global CSS and design tokens
├── astro.config.mjs # Astro configuration
└── package.json     # Project dependencies and scripts
```

## Development

### Local Setup

1. **Clone the repository**
2. **Install dependencies**:
   ```sh
   npm install
   ```
3. **Start the development server**:
   ```sh
   npm run dev
   ```
   The site will be available at `http://localhost:4321`.

### Content Management

New content can be added by creating a new `.md` file in `src/content/work/`. 

Example frontmatter:
```markdown
---
title: "Project Name"
description: "Brief description of the work."
date: 2024-02-01
category: "dev" # or "art", "photography"
featured: true
cover: "./path-to-image.jpg"
tags: ["Astro", "TypeScript"]
liveUrl: "https://example.com"
---
```

## Commands

| Command | Action |
| :--- | :--- |
| `npm run dev` | Starts local dev server at `localhost:4321` |
| `npm run build` | Build your production site to `./dist/` |
| `npm run preview` | Preview your build locally |
| `npm run astro ...` | Run Astro CLI commands |

## Deployment

This project is configured for deployment on **Netlify**. Any push to the `main` branch will automatically trigger a build and deploy.
