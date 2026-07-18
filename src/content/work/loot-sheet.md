---
title: "Loot Sheet"
description: "Visual loot tracking for TBC Classic Anniversary raid loot councils"
date: 2026-05-28
category: "dev"
tags:
  - react
  - vite
  - web-app
cover: "../../assets/images/loot_sheet.png"
liveUrl: "https://bjsmithxyz.github.io/loot-sheet/"
repoUrl: "https://github.com/bjsmithxyz/loot-sheet"
---

A visual loot tracking sheet for World of Warcraft: The Burning Crusade Classic Anniversary. Built for loot councils to assign boss and trash loot, manage rosters, and export results to a spreadsheet.

## What it does

Click **+** on a player row to assign loot from curated TBC boss and trash tables — items show Wowhead icons and tooltips. Switch between Kara, Gruul, Mag, SSC, and TK; Hyjal, BT, and SWP are marked coming soon.

Import rosters from an in-game addon export string, or add players manually. Player names use class colours with optional tank / healer / DPS roles. Export produces tab-separated text plus HTML clipboard output with class-coloured cells.

## WoW addon

The **Loot Sheet Export** addon (`/lt` or `/lootsheet`) copies your party or raid roster into a pipe-separated string:

```
Tanky:Warrior|Healy:Priest|Mmchunt:Hunter
```

Paste it into the web app's Import dialog. The addon lives in `addon/LootTracker/` in the repo.

## Stack

- **Frontend:** Vite + React + Framer Motion
- **Data:** Curated `loot.json` and `raids.json`, with scripts to regenerate from Wowhead
- **Deploy:** GitHub Pages via `gh-pages`

Built for GT.
