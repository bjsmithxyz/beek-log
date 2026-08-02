---
title: "Long Way Round"
description: "An interactive map, timeline, and trip planner for a long journey home"
date: 2026-07-24
category: "dev"
tags:
  - javascript
  - travel
  - mapping
  - web-app
  - static-site
liveUrl: "https://bjsmith.xyz/travel/"
repoUrl: "https://github.com/bjsmithxyz/beek-log/tree/main/src/pages/travel"
---

Long Way Round is an interactive record of my journey, it plots every stop on a map, tracks the route and running trip statistics, and lays the full itinerary out as a timeline.

## Planning the road ahead

Upcoming stops include seasonal weather and daylight estimates from Open-Meteo, alongside a packing cue and the pace of each leg. Past, current, and upcoming stops are derived automatically from the itinerary dates.

## Under the hood

The public map is read-only. Its itinerary lives in `src/data/trips.json`, with all date-derived state computed in the browser so the current stop and day count stay accurate between deploys.

The app is built with Astro and a small client-side JavaScript module, with bundled Leaflet and CARTO / OpenStreetMap tiles for the map.
