import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { Bookmark, EpisodeProgress, ProgressData } from '../lib/progress';
import { progressStore } from '../lib/progress';

interface ProgressApi {
  data: ProgressData;
  episodeProgress(id: string): EpisodeProgress | undefined;
  touchEpisode(id: string): void;
  setPosition(id: string, position: number, anchor?: string): void;
  addReadingSeconds(id: string, seconds: number): void;
  markCompleted(id: string): void;
  isFavorite(id: string): boolean;
  toggleFavorite(id: string): void;
  addBookmark(b: Omit<Bookmark, 'id' | 'createdAt'>): void;
  removeBookmark(id: string): void;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<ProgressData>(() => progressStore.load());
  const ref = useRef(data);
  ref.current = data;

  const update = useCallback((fn: (d: ProgressData) => ProgressData) => {
    setData((prev) => {
      const next = fn(prev);
      ref.current = next;
      progressStore.save(next);
      return next;
    });
  }, []);

  const api = useMemo<ProgressApi>(() => {
    const ensure = (d: ProgressData, id: string): EpisodeProgress =>
      d.episodes[id] ?? {
        episodeId: id,
        position: 0,
        percentRead: 0,
        completed: false,
        lastOpenedAt: new Date().toISOString(),
        totalSeconds: 0
      };
    return {
      data,
      episodeProgress: (id) => data.episodes[id],
      touchEpisode: (id) =>
        update((d) => ({
          ...d,
          lastEpisodeId: id,
          episodes: {
            ...d.episodes,
            [id]: { ...ensure(d, id), lastOpenedAt: new Date().toISOString() }
          },
          history: [{ episodeId: id, openedAt: new Date().toISOString() }, ...d.history].slice(0, 100)
        })),
      setPosition: (id, position, anchor) =>
        update((d) => {
          const ep = ensure(d, id);
          const percentRead = Math.max(ep.percentRead, Math.round(position * 100));
          return {
            ...d,
            episodes: {
              ...d.episodes,
              [id]: { ...ep, position, anchor, percentRead, completed: ep.completed || percentRead >= 98 }
            }
          };
        }),
      addReadingSeconds: (id, seconds) =>
        update((d) => {
          const ep = ensure(d, id);
          return {
            ...d,
            totalReadingSeconds: d.totalReadingSeconds + seconds,
            episodes: { ...d.episodes, [id]: { ...ep, totalSeconds: ep.totalSeconds + seconds } }
          };
        }),
      markCompleted: (id) =>
        update((d) => {
          const ep = ensure(d, id);
          return { ...d, episodes: { ...d.episodes, [id]: { ...ep, completed: true, percentRead: 100 } } };
        }),
      isFavorite: (id) => data.favorites.includes(id),
      toggleFavorite: (id) =>
        update((d) => ({
          ...d,
          favorites: d.favorites.includes(id)
            ? d.favorites.filter((f) => f !== id)
            : [...d.favorites, id]
        })),
      addBookmark: (b) =>
        update((d) => ({
          ...d,
          bookmarks: [
            { ...b, id: `bm-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, createdAt: new Date().toISOString() },
            ...d.bookmarks
          ].slice(0, 200)
        })),
      removeBookmark: (id) =>
        update((d) => ({ ...d, bookmarks: d.bookmarks.filter((b) => b.id !== id) }))
    };
  }, [data, update]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useProgress outside ProgressProvider');
  return ctx;
}
