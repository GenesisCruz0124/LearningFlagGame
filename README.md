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

All flag images are **bundled locally** as SVGs in `flags/` (one per ISO code,
originally from [flagcdn.com](https://flagcdn.com)), so the game needs **no
internet**. If an image ever fails to load, it falls back to a Unicode flag emoji.

- **Web**: a service worker (`sw.js`) precaches the app and every flag on first
  load, so the site works offline afterwards (and is installable as a PWA).
- **Android**: the APK ships all flags inside the app — fully offline, no
  permissions required.

## Project structure

```
index.html        # screens: menu, play, result
sw.js             # service worker (offline precache of app + flags)
css/styles.css    # styling, responsive layout, feedback states
js/data.js        # country dataset (code, name, region, aliases)
js/flags.js       # local flag paths + emoji fallback
js/game.js        # game engine: questions, scoring, answer checking
js/ui.js          # DOM rendering, navigation, persistence
flags/            # 197 bundled SVG flags (xx.svg by ISO code)
```

## Android APK

A native Android wrapper (a full-screen `WebView` that loads the bundled game)
lives in `android/`. The web files are copied into
`android/app/src/main/assets/www/`.

Build a debug APK with Gradle (requires JDK 17+ and the Android SDK with
`platforms;android-34` and `build-tools;34.0.0`):

```bash
cd android
./build-apk.sh        # builds + names the APK by version, plus FlagQuest-latest.apk
# or directly:
./gradlew assembleDebug
# output: app/build/outputs/apk/debug/app-debug.apk
```

The version **auto-increments on every build**: `version.properties` holds
`VERSION_CODE` / `VERSION_NAME`, and each `assemble`/`bundle`/`install` build bumps
the version code by 1 and the `VERSION_NAME` patch by 1 (e.g. 1.0.1 → 1.0.2).

If you change the web files at the repo root, re-sync them before building
(including `flags/`):

```bash
cp index.html android/app/src/main/assets/www/
cp css/styles.css android/app/src/main/assets/www/css/
cp flags/*.svg android/app/src/main/assets/www/flags/
cp js/*.js android/app/src/main/assets/www/js/
```

App id `com.flagquest.app`, minSdk 21, targetSdk 34. No permissions are required —
all flags are bundled in the APK, so it runs fully offline.

## Deploying

It's a static site — host it anywhere.

This repo includes a GitHub Actions workflow
(`.github/workflows/deploy-pages.yml`) that publishes the site to **GitHub
Pages** on every push to `main`. To turn it on once: repo **Settings → Pages →
Build and deployment → Source: GitHub Actions**. After that, pushes to `main`
deploy automatically to `https://<user>.github.io/<repo>/`.
