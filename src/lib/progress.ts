// Reader progress persistence. localStorage today; the ProgressStore
// interface is the seam where cloud sync / accounts plug in later.
export interface EpisodeProgress {
  episodeId: string;
  /** 0..1 scroll position within the episode. */
  position: number;
  /** Anchor block id to restore precisely. */
  anchor?: string;
  percentRead: number;
  completed: boolean;
  lastOpenedAt: string; // ISO
  totalSeconds: number;
}

export interface Bookmark {
  id: string;
  episodeId: string;
  anchor: string;
  excerpt: string;
  createdAt: string;
}

export interface HistoryEntry {
  episodeId: string;
  openedAt: string;
}

export interface ProgressData {
  version: 1;
  lastEpisodeId?: string;
  episodes: Record<string, EpisodeProgress>;
  bookmarks: Bookmark[];
  favorites: string[];
  history: HistoryEntry[];
  totalReadingSeconds: number;
}

export interface ProgressStore {
  load(): ProgressData;
  save(data: ProgressData): void;
}

const KEY = 'atk.progress.v1';

export const emptyProgress = (): ProgressData => ({
  version: 1,
  episodes: {},
  bookmarks: [],
  favorites: [],
  history: [],
  totalReadingSeconds: 0
});

export class LocalProgressStore implements ProgressStore {
  load(): ProgressData {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return emptyProgress();
      const parsed = JSON.parse(raw);
      if (parsed?.version !== 1) return emptyProgress();
      return { ...emptyProgress(), ...parsed };
    } catch {
      return emptyProgress();
    }
  }
  save(data: ProgressData): void {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* storage full or unavailable: progress simply won't persist */
    }
  }
}

export const progressStore: ProgressStore = new LocalProgressStore();
