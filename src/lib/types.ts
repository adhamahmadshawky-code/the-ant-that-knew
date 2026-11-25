// Content schema for The Ant That Knew.
// Content lives under /content as JSON files; see docs/CONTENT-GUIDE.md.

export type Direction = 'ltr' | 'rtl';
export type EpisodeStatus = 'published' | 'draft';

export interface SeasonMeta {
  id: string;
  number: number;
  title: string;
  description: string;
  coverImage?: string; // relative to the season directory
}

export interface EasterEgg {
  id: string;
  /** How the egg is revealed. 'konami' = arrow-key sequence, 'long-press-logo'. */
  trigger: 'konami' | 'long-press-logo';
  text: string;
}

export interface EpisodeMeta {
  id: string; // unique across the platform, e.g. "s01e01"
  seasonId: string;
  number: number;
  title: string;
  subtitle?: string;
  description: string;
  language?: string; // BCP-47, e.g. "ar", "en"
  direction?: Direction;
  coverImage?: string; // relative to the episode directory
  publishedAt?: string; // ISO date, drives "Recently Added"
  status: EpisodeStatus;
  featured?: boolean;
  /** True for sample/demo episodes that ship only to show the architecture. */
  placeholder?: boolean;
  readingTimeMinutes?: number; // computed from word count when omitted
  prev?: string | null; // episode id
  next?: string | null; // episode id
  /** Looping ambient audio file for the whole episode (relative path). */
  ambientAudio?: { src: string; label?: string };
  /** Procedural soundscape config (relative path to a SoundConfig JSON). */
  soundscape?: string;
  soundscapeLabel?: string;
  easterEggs?: EasterEgg[];
}

export type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string; level?: 2 | 3 }
  | { type: 'dialogue'; speaker?: string; lines: string[] }
  | { type: 'image'; src: string; alt: string; caption?: string }
  | { type: 'full-width-image'; src: string; alt: string; caption?: string }
  | { type: 'quote'; text: string; attribution?: string }
  | { type: 'pull-quote'; text: string }
  | { type: 'scene-break'; variant?: 'ants' | 'line' | 'dots' }
  | { type: 'audio'; src: string; label?: string }
  | { type: 'ambient-audio'; action: 'start' | 'stop'; src?: string; profile?: 'colony' | 'dread' | 'forest' }
  | { type: 'sound-effect'; src: string; when?: 'visible' | 'click'; label?: string }
  | { type: 'gallery'; images: { src: string; alt: string; caption?: string }[] }
  | { type: 'special-note'; text: string; tone?: 'info' | 'warning' }
  | {
      // Composite block: a titled scene with paragraphs, an illustration and
      // optional word-synced narration. Used by the narrated episodes.
      type: 'scene';
      id: string;
      title?: string;
      paragraphs: string[];
      image?: string;
      imageAlt?: string;
      narration?: { src: string; wordTimings?: number[] };
    }
  | { type: 'spoiler'; label?: string; untilEpisode?: string; blocks: Block[] }
  | { type: 'chapter-end'; text?: string };

export interface EpisodeContent {
  blocks: Block[];
}

export interface Episode extends EpisodeMeta {
  dir: string; // content directory, for resolving relative assets
  blocks: Block[];
  season?: SeasonMeta;
}

export type EncyclopediaCategory = 'character' | 'colony' | 'location' | 'species' | 'concept';

export interface EncyclopediaEntry {
  id: string;
  category: EncyclopediaCategory;
  name: string;
  summary: string;
  body: string[];
  image?: string;
  language?: string;
  direction?: Direction;
  relatedEpisodeIds?: string[];
  placeholder?: boolean;
}

export interface TimelineEvent {
  id: string;
  title: string;
  summary: string;
  episodeId?: string;
  order: number;
  language?: string;
  direction?: Direction;
}
