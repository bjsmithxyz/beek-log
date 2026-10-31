---
title: "1 Star Maccas"
description: "The worst 1-star Google reviews from McDonald's around the world"
date: 2026-05-27
category: "dev"
tags:
  - react
  - vite
  - typescript
  - tailwind
  - leaflet
  - supabase
cover: "../../assets/images/one_star_maccas.png"
liveUrl: "https://bjsmithxyz.github.io/one-star-maccas/"
repoUrl: "https://github.com/bjsmithxyz/one-star-maccas"
---

A site collecting real 1-star Google reviews from McDonald's locations worldwide. Browse by location, hit random, or explore the map — then honk at the ones that deserve it.

## What is it

Each restaurant page shows one star rated reviews with photos, Google Maps source links, and a Discord-style clown reaction bar. The home page surfaces site stats and the most-clowned-on reviews globally.

An interactive Leaflet map at `/map` plots geocoded locations across 100+ cities. Everything ships as a static Vite build with a JSON dataset — no server required for hosting.

## Stack

- **Frontend:** Vite + React + TypeScript + Tailwind
- **Map:** Leaflet + OpenStreetMap tiles (lazy-loaded)
- **Reactions:** Supabase RPC for shared honk counts across visitors
- **Data:** Static JSON in `src/data/`, built from Google Places and Outscraper ingest scripts

## Data pipeline

Node ingest scripts pull real reviews (filtered to 1-star, with live Google Maps links), dedupe by `sourceUrl`, download review photos, and rank entries by length (`funnyRank`). A geocoding script adds lat/lng via OpenStreetMap Nominatim for the map view.

## Disclaimer

Not affiliated with McDonald's Corporation. Review text and photos remain the property of their authors and Google. This project curates publicly available content for entertainment.