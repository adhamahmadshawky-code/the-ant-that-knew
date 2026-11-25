# Content Guide

Everything a reader sees is driven by files under `content/`. You never edit
application code to publish an episode.

## Add an episode

1. Pick its season folder, e.g. `content/seasons/season-01/` (or create a new
   season folder with a `season.json`).
2. Create `episodes/episode-03/` (any folder name) with:

```
episode-03/
  episode.json    metadata
  content.json    the story, as blocks
  images/         illustrations referenced by the blocks
  audio/          narration clips and sound files
  sound.json      optional procedural soundscape config
```

3. `npm run validate:content` to check it. Build errors block; missing optional
   assets warn.

### episode.json

```json
{
  "id": "s01e03",
  "seasonId": "season-01",
  "number": 3,
  "title": "…",
  "subtitle": "الحلقة الثالثة",
  "description": "…",
  "language": "ar",
  "direction": "rtl",
  "coverImage": "images/cover.jpg",
  "publishedAt": "2026-12-01",
  "status": "published",
  "featured": false,
  "placeholder": false,
  "prev": "s01e02",
  "next": null,
  "ambientAudio": { "src": "audio/forest-loop.mp3", "label": "…" },
  "soundscape": "sound.json",
  "easterEggs": [{ "id": "x", "trigger": "konami", "text": "…" }]
}
```

- `id` must be unique everywhere. `status: "draft"` hides the episode.
- `placeholder: true` marks sample content with a visible badge.
- `readingTimeMinutes` is computed from word count when omitted.
- `featured: true` puts it on the homepage.

### content.json blocks

`{ "blocks": [ … ] }`. Supported block types:

| type | fields | notes |
|---|---|---|
| `paragraph` | `text` | body text |
| `heading` | `text`, `level?` | appears in the table of contents |
| `dialogue` | `speaker?`, `lines[]` | character dialogue styling |
| `image` | `src`, `alt`, `caption?` | inline illustration |
| `full-width-image` | `src`, `alt`, `caption?` | edge-to-edge cinematic image |
| `quote` | `text`, `attribution?` | attributed quote |
| `pull-quote` | `text` | large display quote |
| `scene-break` | `variant?`: `ants`/`line`/`dots` | cinematic break |
| `audio` | `src`, `label?` | positioned playable clip |
| `ambient-audio` | `action`: `start`/`stop`, `src` | starts/stops the ambient bed when scrolled into view |
| `sound-effect` | `src`, `when?`: `visible`/`click`, `label?` | one-shot, never overlaps |
| `gallery` | `images[]` | interactive gallery |
| `special-note` | `text`, `tone?`: `info`/`warning` | narrative annotation |
| `scene` | see below | titled scene with word-synced narration |
| `spoiler` | `label?`, `untilEpisode?`, `blocks[]` | hidden until revealed |
| `chapter-end` | `text?` | closing experience; marks the episode completed |

### The `scene` block (narrated episodes)

```json
{
  "type": "scene",
  "id": "scene-01",
  "title": "optional title (table of contents entry)",
  "paragraphs": ["…", "…"],
  "image": "images/comic_01.jpg",
  "imageAlt": "…",
  "narration": { "src": "audio/narration_01.mp3", "wordTimings": [0.0, 0.48, 1.36] }
}
```

`wordTimings` is one timestamp (seconds) per word, covering the title words first,
then the paragraphs in order. When present, readers get word-by-word tracking and
can click any word to jump the narration there. The validator warns when the word
count and timing count disagree.

### Soundscapes (`sound.json`)

A procedural Web Audio score: per-scene `beds` (wind, rumble, rustle, trickle,
cicada, pulse, chirp, drop, music, drone), optional `tense` scene indices, and
`effects` (`riser` / `alarm` / `bell`) fired at a scene. The engine is in
`src/audio/SoundEngine.ts`; copy an existing episode's `sound.json` as a starting
point. `soundscapeLabel` in `episode.json` names it in the UI.

### Images and audio

Reference assets relative to the episode folder (`images/x.jpg`). All common
image and audio formats are bundled. Optimize images (≤ ~600 KB) for fast loads;
the app lazy-loads everything.

### Encyclopedia and timeline

- `content/encyclopedia/<id>.json`: `{ id, category, name, summary, body[], image?, language?, direction?, relatedEpisodeIds[] }`.
  Categories: `character`, `colony`, `location`, `species`, `concept`.
- `content/timeline/<file>.json`: an array of `{ id, order, title, summary, episodeId? }`.

### What the validator checks

Invalid JSON, missing required metadata, duplicate episode IDs, unknown season or
episode references, broken asset references, images without alt text, and
word/timing count mismatches. Errors fail the build; missing optional assets
only warn and degrade gracefully at runtime.
