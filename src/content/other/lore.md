---
title: "Lore"
description: "A local-first visual story bible for building fiction worlds as an explorable graph"
date: 2026-11-01
category: "dev"
tags:
  - react
  - typescript
  - vite
  - react-flow
  - indexeddb
  - writing
  - web-app
repoUrl: "https://github.com/bjsmithxyz/Lore"
---

Lore is a local-first visual story bible for building fiction worlds as an explorable graph. Create characters, places, objects, factions, events, and concepts, then connect them with relationships you define yourself.

## Build a world

Add a node, give it a type, and fill in the details you need to remember. Each node supports aliases, summaries, tags, and Markdown notes. Relationships can be directed or undirected, labelled with anything from `knows` to `located in`, and documented with their own notes.

The graph is paired with a searchable node list and an inspector panel, so the canvas can stay useful for orientation without getting in the way of precise editing. Search across names, aliases, summaries, notes, and tags; filter by node type; or focus on a node's immediate neighbourhood.

## Local by default

Projects autosave in the browser and can be reopened from a local project list. Lore uses IndexedDB when available, with a local storage fallback. There is no account, backend, or cloud sync — story worlds stay on the device where they were created.

Import and export projects as JSON, or export a complete Markdown story bible for use elsewhere.

## Features

- **Story graph** — pan, zoom, drag, and connect nodes on a React Flow canvas
- **Flexible lore** — custom node types, relationship labels, aliases, tags, and Markdown notes
- **Fast retrieval** — search, type filters, relationship navigation, and neighbourhood focus
- **Local projects** — create and reopen multiple worlds with autosave
- **Portable exports** — import and export JSON or generate a Markdown story bible
- **Themes and preferences** — eight themes, relationship labels, snap-to-grid, reduced motion, and configurable autosave

## Stack

React, TypeScript, Vite, and React Flow. Static deployment is configured for GitHub Pages.
