# 🌍 Flag Quest

A lightweight browser game for learning the flags of the world. No build step,
no dependencies — just open it in a browser.

## Game modes

- **Multiple Choice** — see a flag, pick the country from four options.
- **Type the Country** — see a flag, type its name. Forgiving matching handles
  accents, casing, and common aliases (e.g. `usa`, `uk`, `holland`).
- **Find the Flag** — see a country name, pick the matching flag.
- **Timed Challenge** — score as many as you can in 60 seconds.

Each mode tracks your **score** and **streak** and lets you toggle which
**continents** to include (Africa, Asia, Europe, North America, South America,
Oceania). A non-timed round shows **every flag in the selected continents exactly
once** (no repeats), so the round length follows your selection. Your **best
score** is remembered per setup in the browser via `localStorage`.

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

## Android APK

A native Android wrapper (a full-screen `WebView` that loads the bundled game)
lives in `android/`. The web files are copied into
`android/app/src/main/assets/www/`.

Build a debug APK with Gradle (requires JDK 17+ and the Android SDK with
`platforms;android-34` and `build-tools;34.0.0`):

```bash
cd android
./gradlew assembleDebug
# output: app/build/outputs/apk/debug/app-debug.apk
```

If you change the web files at the repo root, re-sync them before building:

```bash
cp index.html android/app/src/main/assets/www/
cp css/styles.css android/app/src/main/assets/www/css/
cp js/*.js android/app/src/main/assets/www/js/
```

App id `com.flagquest.app`, minSdk 21, targetSdk 34. The `INTERNET` permission is
declared so flag images load from flagcdn.com (emoji fallback works offline).

## Deploying

It's a static site — host it anywhere.

This repo includes a GitHub Actions workflow
(`.github/workflows/deploy-pages.yml`) that publishes the site to **GitHub
Pages** on every push to `main`. To turn it on once: repo **Settings → Pages →
Build and deployment → Source: GitHub Actions**. After that, pushes to `main`
deploy automatically to `https://<user>.github.io/<repo>/`.
