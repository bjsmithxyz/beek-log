---
title: "Echoes"
description: "An interactive art piece — type English, watch Mandarin drift into the void"
date: 2025-09-26
category: "dev"
tags:
  - javascript
  - mandarin
  - digital-art
  - web-app
liveUrl: "https://bjsmithxyz.github.io/Echoes/"
repoUrl: "https://github.com/bjsmithxyz/Echoes"
---

Echoes is an interactive web app made to test AI capabilities. Type the English word shown on screen; when input correctly the Mandarin translation manifests and drifts into a accumulating cloud in the background.

No build step, no backend — just vanilla JS modules served from a static page.

## How it works

1. A random English word (or phrase) appears at the top.
2. As you type, letters highlight correct or incorrect in real time.
3. On completion, the Mandarin character echoes onto the screen and drifts into the background.
4. Completed characters collect in a grid below, building a visual record of the session.

There are no scores, timers, or penalties. Mistakes fade away, only the rhythm of typing and echoes remain.

## Under the hood

- `**words.json**` — English-to-Mandarin mappings; supports alternate spellings via `/` separators
- `**sequences.json**` — typing certain word chains triggers special visual effects
- `**effects.js**` — pluggable animation system (default: drift)
- **Mobile input** — hidden input field handles touch keyboards without breaking the minimal UI

The vocabulary and effects are easy to extend — edit the JSON files and reload.