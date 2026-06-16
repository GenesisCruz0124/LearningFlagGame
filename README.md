# 🌍 Flag Quest

A lightweight browser game for learning the flags of the world. No build step,
no dependencies — just open it in a browser.

## Game modes

- **Multiple Choice** — see a flag, pick the country from four options.
- **Type the Country** — see a flag, type its name. Forgiving matching handles
  accents, casing, and common aliases (e.g. `usa`, `uk`, `holland`).
- **Find the Flag** — see a country name, pick the matching flag.
- **Timed Challenge** — score as many as you can in 60 seconds.

Each mode tracks your **score** and **streak**, lets you filter by **region**
(Africa, Americas, Asia, Europe, Oceania), and remembers your **best score** per
mode/region in the browser via `localStorage`.

## How to run

Just open `index.html` in any modern browser.

Or serve it locally (recommended, avoids any file:// quirks):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Flags & offline use

Flag images are loaded from [flagcdn.com](https://flagcdn.com). If you're offline
or the CDN is blocked, the game automatically falls back to Unicode flag emojis,
so it stays playable everywhere (emoji rendering quality varies by OS).

## Project structure

```
index.html        # screens: menu, play, result
css/styles.css    # styling, responsive layout, feedback states
js/data.js        # country dataset (code, name, region, aliases)
js/flags.js       # flag image URLs + emoji fallback
js/game.js        # game engine: questions, scoring, answer checking
js/ui.js          # DOM rendering, navigation, persistence
```

## Deploying

It's a static site — host it anywhere (e.g. GitHub Pages: enable Pages on the
repo and point it at the branch root).
