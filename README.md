# The Ant That Knew (ANA)

An interactive digital reading platform for an original fictional universe of ants,
colony life, collective intelligence, survival, and the mysteries of consciousness.

A premium digital book crossed with an episodic reading app: illustrated episodes,
word-synced Arabic narration, procedural ambient soundscapes, reading progress,
bookmarks, a story timeline and an encyclopedia.

## Tech stack

- **Vite + React 18 + TypeScript** — no framework lock-in, instant builds
- **react-router** — clean routes, no server needed
- **Custom CSS design system** — deep forest green, almost-black, warm ivory, amber
- **JSON content files** — add episodes without touching application code
- **localStorage** — anonymous reading progress (cloud-sync ready via `ProgressStore`)

## Quick start

```bash
npm install
npm run dev        # local dev server
npm run build      # type-check, validate content, production build
npm run preview    # serve the production build
npm run validate:content   # content checks only
```

## Project layout

```
content/                    all story content (no app code here)
  seasons/<season-id>/
    season.json             season metadata
    cover.jpg
    episodes/<episode-dir>/
      episode.json          episode metadata
      content.json          story blocks
      images/  audio/  sound.json
  encyclopedia/*.json       world entries
  timeline/*.json           chronological events
src/
  lib/        content loading, schema types, progress store, strings
  audio/      audio engine + procedural SoundEngine (Web Audio)
  reader/     immersive reader: blocks, settings, TOC, scenes
  pages/      home, story, reader, timeline, encyclopedia, stats, search, 404
  components/ layout, wordmark, cards, mini-player
  styles/     design tokens + per-area stylesheets
scripts/
  validate-content.mjs      content validation (runs before every build)
  convert-legacy.mjs        one-time port of the original two episodes
  e2e-check.mjs             local smoke test (serves dist/, headless chrome)
```

## Deploying to Vercel

`vercel.json` is already configured (Vite framework preset + SPA rewrites).
Import the repository in Vercel and deploy - no other settings needed.

## Adding content

See [docs/CONTENT-GUIDE.md](docs/CONTENT-GUIDE.md). Adding Episode 20 is the same
as Episode 1: drop a folder with `episode.json`, `content.json` and assets, run
the build. The app picks it up automatically.

## Current content

- **Season 1** ships with the two published episodes (Arabic, RTL, illustrated,
  fully narrated with word-level tracking and a composed soundscape per scene).
- One clearly-labeled **placeholder** episode demonstrates every content block type.
- Encyclopedia and timeline entries are derived strictly from published episodes -
  no invented lore.

## Notes

- No registration required to read. Progress, bookmarks and preferences live in
  the reader's browser.
- The `ProgressStore` interface (`src/lib/progress.ts`) is the seam where accounts
  and cloud sync plug in later.
- Missing optional assets never crash the site: they surface as build warnings
  and graceful fallbacks.
