// Content validation for The Ant That Knew.
// Errors block the build; warnings (missing optional assets) never do.
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = join(ROOT, 'content');
const errors = [];
const warnings = [];

const readJson = (path, label) => {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    errors.push(`${label}: invalid JSON in ${path} (${e.message})`);
    return null;
  }
};

const checkAsset = (base, rel, label, { optional = true } = {}) => {
  if (!rel) return;
  const p = join(base, rel);
  if (!existsSync(p)) {
    (optional ? warnings : errors).push(`${label}: missing asset ${rel} (${p})`);
  }
};

// Seasons
const seasonIds = new Set();
const seasonsDir = join(CONTENT, 'seasons');
for (const s of readdirSync(seasonsDir)) {
  const sdir = join(seasonsDir, s);
  if (!statSync(sdir).isDirectory()) continue;
  const meta = readJson(join(sdir, 'season.json'), `season ${s}`);
  if (!meta) continue;
  if (!meta.id || !meta.title || typeof meta.number !== 'number') {
    errors.push(`season ${s}: season.json needs id, title and number`);
  }
  if (seasonIds.has(meta.id)) errors.push(`duplicate season id: ${meta.id}`);
  seasonIds.add(meta.id);
  checkAsset(sdir, meta.coverImage, `season ${meta.id}`);
}

// Episodes
const episodeIds = new Set();
const seasonsWithEps = new Set();
for (const s of seasonIds) {
  const epsDir = join(seasonsDir, s, 'episodes');
  if (!existsSync(epsDir)) continue;
  for (const e of readdirSync(epsDir)) {
    const edir = join(epsDir, e);
    if (!statSync(edir).isDirectory()) continue;
    const meta = readJson(join(edir, 'episode.json'), `episode ${e}`);
    const content = readJson(join(edir, 'content.json'), `episode ${e}`);
    if (!meta || !content) continue;
    const label = `episode ${e}`;
    for (const f of ['id', 'seasonId', 'title', 'description']) {
      if (!meta[f]) errors.push(`${label}: episode.json missing "${f}"`);
    }
    if (typeof meta.number !== 'number') errors.push(`${label}: episode.json missing numeric "number"`);
    if (!['published', 'draft'].includes(meta.status)) {
      errors.push(`${label}: status must be "published" or "draft"`);
    }
    if (episodeIds.has(meta.id)) errors.push(`duplicate episode id: ${meta.id}`);
    episodeIds.add(meta.id);
    if (!seasonIds.has(meta.seasonId)) {
      errors.push(`${label}: references unknown season "${meta.seasonId}"`);
    } else {
      seasonsWithEps.add(meta.seasonId);
    }
    if (meta.seasonId && meta.seasonId !== s) {
      errors.push(`${label}: lives under season "${s}" but declares seasonId "${meta.seasonId}"`);
    }
    checkAsset(edir, meta.coverImage, label);
    checkAsset(edir, meta.ambientAudio?.src, label);
    checkAsset(edir, meta.soundscape, label, { optional: false });
    if (!Array.isArray(content.blocks)) {
      errors.push(`${label}: content.json must have a "blocks" array`);
      continue;
    }
    const walk = (blocks, where) => {
      for (const [i, b] of blocks.entries()) {
        const at = `${where} block ${i} (${b?.type ?? 'unknown'})`;
        if (!b || typeof b.type !== 'string') {
          errors.push(`${label}: ${where} block ${i} has no type`);
          continue;
        }
        if ('src' in b) checkAsset(edir, b.src, `${label} ${at}`);
        if (b.type === 'image' || b.type === 'full-width-image') {
          if (!b.alt) warnings.push(`${label} ${at}: image without alt text`);
        }
        if (b.type === 'gallery') {
          for (const [j, im] of (b.images ?? []).entries()) {
            checkAsset(edir, im.src, `${label} ${at} image ${j}`);
            if (!im.alt) warnings.push(`${label} ${at} image ${j}: no alt text`);
          }
        }
        if (b.type === 'scene') {
          if (!Array.isArray(b.paragraphs) || b.paragraphs.length === 0) {
            errors.push(`${label} ${at}: scene needs paragraphs`);
          }
          checkAsset(edir, b.image, `${label} ${at}`);
          checkAsset(edir, b.narration?.src, `${label} ${at}`);
          if (b.narration?.wordTimings) {
            const words =
              (b.title ? b.title.trim().split(/\s+/).length : 0) +
              (b.paragraphs ?? []).reduce((a, p) => a + p.trim().split(/\s+/).filter(Boolean).length, 0);
            if (words !== b.narration.wordTimings.length) {
              warnings.push(
                `${label} ${at}: ${words} words vs ${b.narration.wordTimings.length} word timings`
              );
            }
          }
        }
        if (b.type === 'spoiler') walk(b.blocks ?? [], `${where} block ${i} > spoiler`);
      }
    };
    walk(content.blocks, label);
  }
}

// Cross-references: prev/next, timeline, encyclopedia
const idOk = (id, from) => {
  if (id && !episodeIds.has(id)) errors.push(`${from}: references unknown episode "${id}"`);
};
for (const s of seasonIds) {
  const epsDir = join(seasonsDir, s, 'episodes');
  if (!existsSync(epsDir)) continue;
  for (const e of readdirSync(epsDir)) {
    const metaPath = join(epsDir, e, 'episode.json');
    if (!existsSync(metaPath)) continue;
    const meta = JSON.parse(readFileSync(metaPath, 'utf8'));
    idOk(meta.prev, `episode ${meta.id ?? e} prev`);
    idOk(meta.next, `episode ${meta.id ?? e} next`);
  }
}
const encDir = join(CONTENT, 'encyclopedia');
if (existsSync(encDir)) {
  for (const f of readdirSync(encDir)) {
    const entry = readJson(join(encDir, f), `encyclopedia ${f}`);
    if (!entry) continue;
    for (const f2 of ['id', 'category', 'name', 'summary']) {
      if (!entry[f2]) errors.push(`encyclopedia ${f}: missing "${f2}"`);
    }
    (entry.relatedEpisodeIds ?? []).forEach((id) => idOk(id, `encyclopedia ${entry.id ?? f}`));
  }
}
const tlDir = join(CONTENT, 'timeline');
if (existsSync(tlDir)) {
  for (const f of readdirSync(tlDir)) {
    const events = readJson(join(tlDir, f), `timeline ${f}`);
    if (!Array.isArray(events)) continue;
    events.forEach((ev) => idOk(ev.episodeId, `timeline ${ev.id ?? f}`));
  }
}

for (const w of warnings) console.warn(`warning: ${w}`);
for (const e of errors) console.error(`ERROR: ${e}`);
console.log(
  `content: ${seasonIds.size} season(s), ${episodeIds.size} episode(s), ${warnings.length} warning(s), ${errors.length} error(s)`
);
process.exit(errors.length ? 1 : 0);
