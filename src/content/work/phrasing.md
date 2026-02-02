---
title: "Phrasing"
description: "A static phrase library with instant search and sidebar navigation"
date: 2023-05-10
category: "dev"
tags:
  - nodejs
  - static-site
  - fusejs
  - github-pages
  - web-app
featured: true
liveUrl: "https://bjsmithxyz.github.io/phrasing/"
---

## What is it

It's a lightweight, static app that takes a curated set of Markdown phrase collections and turns them into a browsable library with fast search, category navigation, and a Dracula-themed UI.

The build process converts Markdown files from a `md_files` directory into a single HTML page, generates a searchable data set, and wires up Fuse.js for instant, fuzzy filtering. The UI mirrors the original layout with a fixed sidebar, per-category A–Z links, and a search bar pinned at the top of the content area.

The input format stays intentionally simple, so new collections can be added quickly. Here's an example of the structure the app expects:

```md
# Heading 1

## Heading 2

- Data point 1
  - sub data point
- Data point 2
- Data point 3
```

My goal is to keep experimenting with new phrase collections and datasets that fit the Markdown-first workflow while keeping the browsing experience fast and readable.

## Why is it called Phrasing

The app draws its name from a book of phrases that includes interesting business expressions, impressive phrases, conversational phrases, and more.

For instance, under 'Conversational - I', you might find:

> I am anxious to discharge the very onerous debt I owe you.

The app could be a handy resource for writers seeking inspiration or unique phrasing.

## History

Earlier in the year, while browsing Project Gutenberg, I stumbled upon a book titled 'Fifteen Thousand Useful Phrases' by Grenville Kleiser, first published in 1910. I found the book amusing, particularly envisioning people using these now-outdated phrases in everyday conversation.

The phrases offer a fascinating snapshot of history, despite many of them being archaic or slightly questionable by today's standards.

Around the same time, I was exploring data indexing services and realized a search-first interface would make this treasure trove much easier to navigate. The current version focuses on a static build for speed, with Fuse.js providing instant search across the phrase library.

Originally, I extracted all the content from the book's PDF. However, it became clear that remaking all the individual .md/HTML files would be labor-intensive. Consequently, I decided to develop a web-based index to make the content more accessible.

With Machine Learning (ML), Language Models (LLMs), and AI being current hot topics, I turned to ChatGPT for assistance. The result was a Node.js-driven build pipeline (plus an optional Express server for local development) that outputs a static site ideal for GitHub Pages or other lightweight hosting. Despite the development process proving more challenging than anticipated, ChatGPT played a crucial role in advancing the project, and I doubt I would have gotten even 20% of the way without it...

It even wrote this.
