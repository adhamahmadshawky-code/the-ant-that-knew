import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { SoundEngine, type SoundConfig } from './SoundEngine';

export interface AudioPrefs {
  masterVolume: number; // 0..1
  ambientVolume: number;
  narrationVolume: number;
  sfxVolume: number;
  muted: boolean;
  disabled: boolean; // "disable all sounds"
}

export interface NarrationState {
  episodeId: string;
  seasonId: string;
  episodeTitle: string;
  sceneIndex: number; // 0-based
  sceneCount: number;
  sceneLabel?: string;
  playing: boolean;
  currentTime: number;
  duration: number;
  unavailable: boolean;
}

export interface AmbientState {
  kind: 'file' | 'soundscape';
  label: string;
  active: boolean;
  unavailable: boolean;
}

interface PlayNarrationArgs {
  episodeId: string;
  seasonId: string;
  episodeTitle: string;
  sceneIndex: number;
  sceneCount: number;
  sceneLabel?: string;
  src: string;
  startAt?: number;
  onEnded?: (sceneIndex: number) => void;
}

interface AudioApi {
  prefs: AudioPrefs;
  setVolume(channel: 'master' | 'ambient' | 'narration' | 'sfx', v: number): void;
  toggleMute(): void;
  setDisabled(disabled: boolean): void;
  narration: NarrationState | null;
  playNarration(a: PlayNarrationArgs): void;
  pauseNarration(): void;
  resumeNarration(): void;
  seekNarration(seconds: number): void;
  stopNarration(): void;
  onNarrationTime(cb: (t: number) => void): () => void;
  onNarrationEnded(cb: (sceneIndex: number) => void): () => void;
  ambient: AmbientState | null;
  startAmbientFile(src: string, label: string): void;
  startSoundscape(config: SoundConfig, label: string): void;
  setSoundscapeScene(sceneIndex: number, fromScroll?: boolean): void;
  stopAmbient(): void;
  playSfx(src: string): void;
}

const Ctx = createContext<AudioApi | null>(null);
const PREFS_KEY = 'atk.audio.v1';

const defaultPrefs: AudioPrefs = {
  masterVolume: 1,
  ambientVolume: 0.8,
  narrationVolume: 1,
  sfxVolume: 0.9,
  muted: false,
  disabled: false
};

function loadPrefs(): AudioPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<AudioPrefs>(loadPrefs);
  const [narration, setNarration] = useState<NarrationState | null>(null);
  const [ambient, setAmbient] = useState<AmbientState | null>(null);

  const narrationEl = useRef<HTMLAudioElement | null>(null);
  const ambientEl = useRef<HTMLAudioElement | null>(null);
  const sfxEl = useRef<HTMLAudioElement | null>(null);
  const soundscape = useRef<SoundEngine | null>(null);
  const timeCbs = useRef(new Set<(t: number) => void>());
  const endedCbs = useRef(new Set<(i: number) => void>());
  const prefsRef = useRef(prefs);
  prefsRef.current = prefs;

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
    } catch {
      /* private mode */
    }
  }, [prefs]);

  const effVol = (channel: 'ambient' | 'narration' | 'sfx') => {
    const p = prefsRef.current;
    if (p.disabled || p.muted) return 0;
    const base = p.masterVolume * p[`${channel}Volume`];
    if (channel === 'ambient' && narrationEl.current && !narrationEl.current.paused) return base * 0.4;
    return base;
  };

  const applyVolumes = useCallback(() => {
    if (narrationEl.current) narrationEl.current.volume = effVol('narration');
    if (ambientEl.current) ambientEl.current.volume = effVol('ambient');
    if (sfxEl.current) sfxEl.current.volume = effVol('sfx');
    if (soundscape.current) {
      const p = prefsRef.current;
      const on = !p.disabled && !p.muted && p.ambientVolume > 0 && p.masterVolume > 0;
      soundscape.current.setMusic(on);
      soundscape.current.setSfx(on);
      soundscape.current.setLevel(p.masterVolume * p.ambientVolume);
    }
  }, []);

  useEffect(applyVolumes, [prefs, applyVolumes]);

  const ensureEls = () => {
    if (!narrationEl.current) {
      narrationEl.current = new Audio();
      narrationEl.current.preload = 'auto';
      narrationEl.current.addEventListener('timeupdate', () => {
        const t = narrationEl.current?.currentTime ?? 0;
        timeCbs.current.forEach((cb) => cb(t));
        setNarration((n) => (n ? { ...n, currentTime: t, duration: narrationEl.current?.duration || 0 } : n));
      });
      narrationEl.current.addEventListener('pause', () => {
        setNarration((n) => (n && n.playing ? { ...n, playing: false } : n));
      });
      narrationEl.current.addEventListener('playing', () => {
        setNarration((n) => (n && !n.playing ? { ...n, playing: true } : n));
      });
      narrationEl.current.addEventListener('ended', () => {
        const idx = narrationRef.current?.sceneIndex ?? 0;
        setNarration((n) => (n ? { ...n, playing: false } : n));
        endedCbs.current.forEach((cb) => cb(idx));
      });
      narrationEl.current.addEventListener('error', () => {
        setNarration((n) => (n ? { ...n, unavailable: true, playing: false } : n));
      });
    }
    if (!ambientEl.current) {
      ambientEl.current = new Audio();
      ambientEl.current.loop = true;
      ambientEl.current.preload = 'auto';
      ambientEl.current.addEventListener('error', () => {
        setAmbient((a) => (a ? { ...a, unavailable: true, active: false } : a));
      });
    }
    if (!sfxEl.current) {
      sfxEl.current = new Audio();
      sfxEl.current.preload = 'auto';
    }
  };

  const narrationRef = useRef<NarrationState | null>(null);
  narrationRef.current = narration;

  const playNarration = useCallback(
    (a: PlayNarrationArgs) => {
      ensureEls();
      const el = narrationEl.current!;
      const sameSrc = el.dataset.src === a.src;
      el.dataset.src = a.src;
      setNarration({
        episodeId: a.episodeId,
        seasonId: a.seasonId,
        episodeTitle: a.episodeTitle,
        sceneIndex: a.sceneIndex,
        sceneCount: a.sceneCount,
        sceneLabel: a.sceneLabel,
        playing: true,
        currentTime: a.startAt ?? 0,
        duration: 0,
        unavailable: false
      });
      if (!sameSrc) el.src = a.src;
      el.volume = effVol('narration');
      if (a.startAt) el.currentTime = a.startAt;
      el.play().catch(() => {
        setNarration((n) => (n ? { ...n, playing: false } : n));
      });
      soundscape.current?.resume();
      applyVolumes();
    },
    [applyVolumes]
  );

  const api = useMemo<AudioApi>(() => ({
    prefs,
    setVolume: (channel, v) =>
      setPrefs((p) => ({ ...p, [`${channel}Volume`]: Math.min(1, Math.max(0, v)) })),
    toggleMute: () => setPrefs((p) => ({ ...p, muted: !p.muted })),
    setDisabled: (disabled) => setPrefs((p) => ({ ...p, disabled })),
    narration,
    playNarration,
    pauseNarration: () => {
      narrationEl.current?.pause();
      soundscape.current?.pause();
      ambientEl.current?.pause();
      setNarration((n) => (n ? { ...n, playing: false } : n));
      applyVolumes();
    },
    resumeNarration: () => {
      narrationEl.current?.play().catch(() => undefined);
      soundscape.current?.resume();
      if (ambientEl.current?.src && ambient?.kind === 'file' && ambient.active) ambientEl.current.play().catch(() => undefined);
      setNarration((n) => (n ? { ...n, playing: true } : n));
      applyVolumes();
    },
    seekNarration: (seconds) => {
      if (narrationEl.current) {
        narrationEl.current.currentTime = seconds;
        timeCbs.current.forEach((cb) => cb(seconds));
      }
    },
    stopNarration: () => {
      narrationEl.current?.pause();
      soundscape.current?.pause();
      ambientEl.current?.pause();
      setNarration(null);
      applyVolumes();
    },
    onNarrationTime: (cb) => {
      timeCbs.current.add(cb);
      return () => timeCbs.current.delete(cb);
    },
    onNarrationEnded: (cb) => {
      endedCbs.current.add(cb);
      return () => endedCbs.current.delete(cb);
    },
    ambient,
    startAmbientFile: (src, label) => {
      ensureEls();
      const el = ambientEl.current!;
      // Never restart an already-playing ambient source.
      if (ambient?.kind === 'file' && ambient.active && el.dataset.src === src) return;
      soundscape.current?.stop();
      soundscape.current = null;
      el.dataset.src = src;
      if (el.src !== src) el.src = src;
      el.volume = effVol('ambient');
      el.play().catch(() => setAmbient((a) => (a ? { ...a, active: false } : a)));
      setAmbient({ kind: 'file', label, active: true, unavailable: false });
    },
    startSoundscape: (config, label) => {
      if (ambient?.kind === 'soundscape' && ambient.active && ambient.label === label) return;
      if (ambientEl.current) ambientEl.current.pause();
      soundscape.current?.stop();
      const engine = new SoundEngine(config);
      soundscape.current = engine;
      engine.start();
      applyVolumes();
      setAmbient({ kind: 'soundscape', label, active: true, unavailable: false });
    },
    setSoundscapeScene: (i, fromScroll) => {
      // While narration plays, the narrated scene decides the sound, not the scroll position.
      const n = narrationRef.current;
      soundscape.current?.setScene(fromScroll && n?.playing ? n.sceneIndex : i);
    },
    stopAmbient: () => {
      ambientEl.current?.pause();
      soundscape.current?.stop();
      soundscape.current = null;
      setAmbient(null);
    },
    playSfx: (src) => {
      ensureEls();
      const el = sfxEl.current!;
      // One effect at a time: a new effect replaces the old, never overlaps.
      el.pause();
      el.src = src;
      el.volume = effVol('sfx');
      el.play().catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [prefs, narration, ambient, playNarration, applyVolumes]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useAudio(): AudioApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAudio outside AudioProvider');
  return ctx;
}
