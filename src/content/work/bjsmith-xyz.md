---
title: "bjsmith.xyz"
description: "A filesystem-inspired home for work, film photography, and travel"
date: 2026-07-24
category: "dev"
tags:
  - astro
  - photography
  - travel
  - mapping
  - static-site
liveUrl: "https://bjsmith.xyz/"
repoUrl: "https://github.com/bjsmithxyz/beek-log"
---

bjsmith.xyz is this site: a file-based home for my projects, artwork, film photography, and travel journal. Its interface borrows from a filesystem, with each public section living beneath `~/beek` and the publishing tools kept separately beneath `~/admin`.

## One site

Work and film rolls are authored as Markdown, while the travel route is structured JSON. Astro turns that content into a mostly static public site, with small browser modules reserved for interactive features such as the photo map, lightbox, filters, filesystem tree, and travel view.

The original standalone Long Way Round travel project has been retired. Its useful parts now live at [`travel/`](/travel/) alongside the rest of the site instead of operating as a separate project.

## Publishing without a database

There is no production database or direct-to-main publisher. The hosted admin prepares photo rolls and itinerary updates as source changes, opens a pull request, and waits for a reviewed Deploy Preview before anything is merged and published.

This keeps the public site portable and makes its content history part of the repository itself.
