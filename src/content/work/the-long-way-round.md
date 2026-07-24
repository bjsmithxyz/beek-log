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
liveUrl: "https://travel.bjsmith.xyz"
repoUrl: "https://github.com/bjsmithxyz/long-way-round"
---

Long Way Round is an interactive record of my journey, it plots every stop on a map, tracks the route and running trip statistics, and lays the full itinerary out as a timeline.

## Planning the road ahead

Upcoming stops include seasonal weather and daylight estimates from Open-Meteo, alongside a packing cue and the pace of each leg. Past, current, and upcoming stops are derived automatically from the itinerary dates.

## Editing the route

The trip can be edited directly in the browser. After signing in with GitHub, stops can be added, reordered, or updated and saved back to `trips.json`; Netlify then redeploys the site. The editor can also download the data for a manual commit.

The app is built with vanilla HTML, CSS, and JavaScript, with Leaflet and OpenStreetMap for the map. There is no framework or build step.
