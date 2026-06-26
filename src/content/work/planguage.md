---
title: "Planguage"
description: "An interactive web app that translates English into Planguage — every consonant becomes P"
date: 2026-06-26
category: "dev"
tags:
  - javascript
  - static-site
  - web-app
featured: true
liveUrl: "https://bjsmithxyz.github.io/planguage/"
repoUrl: "https://github.com/bjsmithxyz/planguage"
---

## The rules

1. **Consonants → P** — every consonant becomes `p`; vowels (`a e i o u`) stay as they are.
2. **Natural P** — a `p` already in the original text is kept as a natural P.
3. **Collapse runs** — a run of consecutive `p`s collapses, but a natural P and the replacement P's beside it still count separately.

| English     | Planguage  |
| ----------- | ---------- |
| for example | pop epappe |
| fff         | p          |
| hello       | pepo       |
| paper       | papep      |

Case and sentence-start capitals are preserved, so a sentence still reads like a sentence.

<br>

For Annie.
