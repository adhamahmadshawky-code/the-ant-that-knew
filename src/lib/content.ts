// Content loading: everything under /content is picked up at build time.
// Adding a season or episode means adding files - never editing app code.
import type {
  Block,
  EncyclopediaEntry,
  Episode,
  EpisodeContent,
  EpisodeMeta,
  SeasonMeta,
  TimelineEvent
} from './types';

export type { Block, Episode, EpisodeMeta, SeasonMeta, EncyclopediaEntry, TimelineEvent } from './types';

const seasonFiles = import.meta.glob('/content/seasons/*/season.json', {
  eager: true,
  import: 'default'
}) as Record<string, SeasonMeta>;

const episodeMetaFiles = import.meta.glob('/content/seasons/*/episodes/*/episode.json', {
  eager: true,
  import: 'default'
}) as Record<string, EpisodeMeta>;

const episodeContentFiles = import.meta.glob('/content/seasons/*/episodes/*/content.json', {
  eager: true,
  import: 'default'
}) as Record<string, EpisodeContent>;

const encyclopediaFiles = import.meta.glob('/content/encyclopedia/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, EncyclopediaEntry>;

const timelineFiles = import.meta.glob('/content/timeline/*.json', {
  eager: true,
  import: 'default'
}) as Record<string, TimelineEvent[]>;

const soundscapeFiles = import.meta.glob('/content/seasons/*/episodes/*/sound.json', {
  eager: true,
  import: 'default'
}) as Record<string, import('../audio/SoundEngine').SoundConfig>;

// Every asset under /content is bundled and addressable by its content path.
const assetUrls = import.meta.glob('/content/**/*.{jpg,jpeg,png,webp,avif,gif,mp3,ogg,wav,m4a}', {
  eager: true,
  query: '?url',
  import: 'default'
}) as Record<string, string>;

function dirOf(path: string): string {
  return path.slice(0, path.lastIndexOf('/'));
}

/** Resolve a content-relative asset reference (relative to dir) to a bundled URL. */
export function assetUrl(dir: string, rel?: string): string | undefined {
  if (!rel) return undefined;
  const key = `${dir}/${rel}`.replace(/\/\.\//g, '/');
  const url = assetUrls[key];
  if (!url) {
    console.warn(`[content] missing asset: ${key}`);
    return undefined;
  }
  return url;
}

function countWords(blocks: Block[]): number {
  let words = 0;
  const add = (t?: string) => {
    if (t) words += t.trim().split(/\s+/).filter(Boolean).length;
  };
  for (const b of blocks) {
    switch (b.type) {
      case 'paragraph':
      case 'heading':
      case 'quote':
      case 'pull-quote':
      case 'special-note':
        add(b.text);
        break;
      case 'dialogue':
        b.lines.forEach(add);
        break;
      case 'scene':
        add(b.title);
        b.paragraphs.forEach(add);
        break;
      case 'spoiler':
        words += countWords(b.blocks);
        break;
      default:
        break;
    }
  }
  return words;
}

export const seasons: SeasonMeta[] = Object.entries(seasonFiles)
  .map(([, s]) => s)
  .sort((a, b) => a.number - b.number);

const allEpisodes: Episode[] = Object.entries(episodeMetaFiles).map(([path, meta]) => {
  const dir = dirOf(path);
  const contentPath = `${dir}/content.json`;
  const blocks = episodeContentFiles[contentPath]?.blocks ?? [];
  const season = seasons.find((s) => s.id === meta.seasonId);
  const readingTimeMinutes =
    meta.readingTimeMinutes ?? Math.max(1, Math.round(countWords(blocks) / 160));
  return { ...meta, dir, blocks, season, readingTimeMinutes };
});

export const episodes: Episode[] = allEpisodes
  .filter((e) => e.status === 'published')
  .sort((a, b) => {
    const sa = a.season?.number ?? 0;
    const sb = b.season?.number ?? 0;
    return sa === sb ? a.number - b.number : sa - sb;
  });

export function getEpisode(seasonId: string, episodeId: string): Episode | undefined {
  return episodes.find((e) => e.seasonId === seasonId && e.id === episodeId);
}

export function getEpisodeById(id: string): Episode | undefined {
  return episodes.find((e) => e.id === id);
}

export function getSeason(id: string): SeasonMeta | undefined {
  return seasons.find((s) => s.id === id);
}

export function seasonEpisodes(seasonId: string): Episode[] {
  return episodes.filter((e) => e.seasonId === seasonId);
}

export function episodeCover(ep: Episode): string | undefined {
  return assetUrl(ep.dir, ep.coverImage);
}

export function seasonCover(season: SeasonMeta): string | undefined {
  return assetUrl(`/content/seasons/${season.id}`, season.coverImage);
}

/** Explicit prev/next metadata wins; otherwise fall back to season order. */
export function neighborsOf(ep: Episode): { prev?: Episode; next?: Episode } {
  const byOrder = () => {
    const i = episodes.indexOf(ep);
    return { prev: episodes[i - 1], next: episodes[i + 1] };
  };
  const ordered = byOrder();
  return {
    prev: ep.prev ? getEpisodeById(ep.prev) ?? ordered.prev : ordered.prev,
    next: ep.next ? getEpisodeById(ep.next) ?? ordered.next : ordered.next
  };
}

export const featuredEpisode: Episode | undefined =
  episodes.find((e) => e.featured && !e.placeholder) ?? episodes.find((e) => e.featured) ?? episodes[0];

export const recentEpisodes: Episode[] = [...episodes]
  .filter((e) => e.publishedAt)
  .sort((a, b) => (b.publishedAt! < a.publishedAt! ? -1 : 1))
  .slice(0, 6);

export const encyclopedia: EncyclopediaEntry[] = Object.values(encyclopediaFiles).sort((a, b) =>
  a.name.localeCompare(b.name)
);

export function getEncyclopediaEntry(id: string): EncyclopediaEntry | undefined {
  return encyclopedia.find((e) => e.id === id);
}

export const timeline: TimelineEvent[] = Object.values(timelineFiles)
  .flat()
  .sort((a, b) => a.order - b.order);

/** Procedural soundscape config for an episode, if it ships one. */
export function episodeSoundscape(ep: Episode): import('../audio/SoundEngine').SoundConfig | undefined {
  if (!ep.soundscape) return undefined;
  const cfg = soundscapeFiles[`${ep.dir}/${ep.soundscape}`];
  if (!cfg) console.warn(`[content] missing soundscape: ${ep.dir}/${ep.soundscape}`);
  return cfg;
}

/** Total word count of an episode's readable text (for stats). */
export function episodeWordCount(ep: Episode): number {
  return countWords(ep.blocks);
}
