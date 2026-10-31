---
title: "Phrasing"
description: "A static phrase library with fuzzy search, dataset switching, and theme support"
date: 2023-05-10
category: "dev"
tags:
  - nodejs
  - static-site
  - fusejs
  - github-pages
  - web-app
liveUrl: "https://bjsmithxyz.github.io/phrasing/"
repoUrl: "https://github.com/bjsmithxyz/phrasing"
---

Phrasing is a lightweight static app for browsing and searching phrase collections stored as Markdown. Built-in corpora ship with the site; you can switch datasets in the browser or upload your own `.md` files without a page reload.

## What it does

The build pipeline converts Markdown under `data/builtin/` into a searchable static site. Fuse.js handles fuzzy search; a fixed sidebar provides category navigation and A–Z section links. The same parsing logic runs at build time and in the browser via shared `content-core.js`, so uploaded files behave identically to built-in datasets.

Input format stays deliberately simple:

```md
# Category name

## A

- First phrase
- Second phrase
```

A single file can contain multiple `#` sections. List items under `##` letter headings become searchable entries.

## Built-in datasets


| Dataset      | Contents                                                                         |
| ------------ | -------------------------------------------------------------------------------- |
| **phrasing** | ~15,000 entries from *Fifteen Thousand Useful Phrases* (Grenville Kleiser, 1910) |
| **insults**  | Shakespeare insults, grouped by type                                             |


Add a folder under `data/builtin/` and rebuild — the manifest picks it up automatically.

## Why "Phrasing"

The default corpus comes from a Project Gutenberg find: a 1910 reference book of business expressions, conversational phrases, impressive formulations, and more. Under *Conversational — I*, you might find:

> I am anxious to discharge the very onerous debt I owe you.

Most entries are archaic or slightly questionable by modern standards, which is part of the charm — a searchable snapshot of how people were told to sound articulate a century ago.

## Current features

- **Dataset switching** — toggle between built-in corpora or upload custom Markdown via the data control
- **Instant search** — Fuse.js fuzzy matching across all indexed phrases
- **Themes** — Dracula, Cursor, Orangde, Black & White, Light, Sepia, and Rose
- **Static hosting** — `npm run build` outputs to `dist/`; deploys to GitHub Pages on push via Actions

Stack: Node.js build script, markdown-it, Fuse.js, optional Express dev server.