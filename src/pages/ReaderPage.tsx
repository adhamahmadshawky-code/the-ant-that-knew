import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { assetUrl, episodeSoundscape, getEpisode, neighborsOf } from '../lib/content';
import { useAudio } from '../audio/AudioContext';
import { useProgress } from '../state/ProgressContext';
import { BlockList, type BlockRenderContext } from '../reader/BlockRenderer';
import ReaderSettingsPanel from '../reader/ReaderSettings';
import TableOfContents, { tocFromBlocks } from '../reader/TableOfContents';
import { loadReaderSettings, saveReaderSettings, type ReaderSettings } from '../reader/settings';
import { episodeLang, t } from '../lib/strings';
import NotFoundPage from './NotFoundPage';
import type { Block } from '../lib/types';

const WIDTHS = { narrow: '30rem', medium: '38rem', wide: '48rem' } as const;

export default function ReaderPage() {
  const { seasonId = '', episodeId = '' } = useParams();
  const ep = getEpisode(seasonId, episodeId);
  const audio = useAudio();
  const progress = useProgress();
  const [settings, setSettings] = useState<ReaderSettings>(loadReaderSettings);
  const [showToc, setShowToc] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeScene, setActiveScene] = useState(-1);
  const [activeWord, setActiveWord] = useState(-1);
  const [eggText, setEggText] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const restored = useRef(false);
  // Effect callbacks fire long after render; always read the latest audio api.
  const audioRef = useRef(audio);
  audioRef.current = audio;

  const lang = episodeLang(ep?.language);
  const dir = ep?.direction ?? 'ltr';

  const sceneBlocks = useMemo(() => {
    if (!ep) return [] as { block: Extract<Block, { type: 'scene' }>; blockIndex: number }[];
    return ep.blocks
      .map((block, blockIndex) => ({ block, blockIndex }))
      .filter((x): x is { block: Extract<Block, { type: 'scene' }>; blockIndex: number } => x.block.type === 'scene');
  }, [ep]);

  const sceneIndices = useMemo(() => {
    const m = new Map<number, number>();
    sceneBlocks.forEach((s, i) => m.set(s.blockIndex, i));
    return m;
  }, [sceneBlocks]);

  const patchSettings = useCallback((patch: Partial<ReaderSettings>) => {
    setSettings((s) => {
      const next = { ...s, ...patch };
      saveReaderSettings(next);
      return next;
    });
  }, []);

  // Register the visit and set the tab title.
  useEffect(() => {
    if (!ep) return;
    progress.touchEpisode(ep.id);
    document.title = `${ep.title} - The Ant That Knew`;
    return () => {
      document.title = 'The Ant That Knew';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id]);

  // Stop the episode's ambient bed when leaving the reader; narration keeps
  // playing in the mini-player by design.
  useEffect(() => {
    return () => audio.stopAmbient();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id]);

  // Restore last reading position once.
  useEffect(() => {
    if (!ep || restored.current) return;
    restored.current = true;
    const saved = progress.episodeProgress(ep.id);
    if (!saved || saved.position < 0.02) return;
    requestAnimationFrame(() => {
      if (saved.anchor && document.getElementById(saved.anchor)) {
        document.getElementById(saved.anchor)!.scrollIntoView({ block: 'start' });
      } else {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo({ top: Math.round(saved.position * max) });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id]);

  // Track scroll position, percent read and the scene in view.
  useEffect(() => {
    if (!ep) return;
    let raf = 0;
    let lastSave = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const pos = max > 0 ? Math.min(1, window.scrollY / max) : 1;
        const scenes = Array.from(document.querySelectorAll<HTMLElement>('.scene'));
        let current: { id: string; index: number } | undefined;
        for (const el of scenes) {
          if (el.getBoundingClientRect().top < window.innerHeight * 0.4) {
            current = { id: el.id, index: Number(el.dataset.scene ?? 0) };
          } else break;
        }
        if (current && current.index !== activeScene) {
          setActiveScene(current.index);
          audio.setSoundscapeScene(current.index);
        }
        const now = Date.now();
        if (now - lastSave > 1500) {
          lastSave = now;
          progress.setPosition(ep.id, pos, current?.id);
        }
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id, activeScene]);

  // Count active reading time.
  useEffect(() => {
    if (!ep) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') progress.addReadingSeconds(ep.id, 5);
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id]);

  const playScene = useCallback(
    (sceneIndex: number, startAt?: number) => {
      if (!ep) return;
      const target = sceneBlocks[sceneIndex]?.block;
      if (!target?.narration) return;
      const src = assetUrl(ep.dir, target.narration.src);
      if (!src) return;
      // Start the episode's soundscape on the first play gesture.
      const soundscape = episodeSoundscape(ep);
      if (soundscape && !audio.ambient) {
        audio.startSoundscape(soundscape, ep.soundscapeLabel ?? ep.title);
      }
      audio.setSoundscapeScene(sceneIndex);
      audio.playNarration({
        episodeId: ep.id,
        seasonId: ep.seasonId,
        episodeTitle: ep.title,
        sceneIndex,
        sceneCount: sceneBlocks.length,
        sceneLabel: target.title,
        src,
        startAt
      });
      setActiveScene(sceneIndex);
      const el = document.getElementById(target.id);
      if (el && sceneIndex !== activeScene) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    [ep, sceneBlocks, audio, activeScene]
  );

  // Auto-advance to the next narrated scene.
  useEffect(() => {
    return audio.onNarrationEnded((sceneIndex) => {
      if (!ep || audioRef.current.narration?.episodeId !== ep.id) return;
      const next = sceneBlocks.findIndex((s, i) => i > sceneIndex && s.block.narration);
      if (next >= 0) playScene(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id, sceneBlocks, playScene]);

  // Word sync: map playback time to a word index in the active scene.
  useEffect(() => {
    return audio.onNarrationTime((timeSec) => {
      const n = audioRef.current.narration;
      if (!ep || n?.episodeId !== ep.id) return;
      const idx = n.sceneIndex;
      const timings = sceneBlocks[idx]?.block.narration?.wordTimings;
      if (!timings?.length) return;
      let lo = 0;
      let hi = timings.length - 1;
      while (lo < hi) {
        const mid = (lo + hi + 1) >> 1;
        if (timings[mid] <= timeSec) lo = mid;
        else hi = mid - 1;
      }
      setActiveWord(timeSec >= timings[0] ? lo : -1);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id, sceneBlocks]);

  const seekWord = useCallback(
    (sceneIndex: number, wordIndex: number) => {
      if (!ep) return;
      const timings = sceneBlocks[sceneIndex]?.block.narration?.wordTimings;
      if (!timings || wordIndex >= timings.length) return;
      const at = timings[wordIndex];
      const sameScene = audio.narration?.episodeId === ep.id && audio.narration.sceneIndex === sceneIndex;
      if (sameScene) {
        audio.seekNarration(at);
        audio.resumeNarration();
      } else {
        playScene(sceneIndex, at);
      }
    },
    [ep, sceneBlocks, audio, playScene]
  );

  // Keyboard navigation: j/k scenes, n/p episodes, space play/pause, c cinematic.
  useEffect(() => {
    if (!ep) return;
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (e.key === 'j' || e.key === 'k') {
        const delta = e.key === 'j' ? 1 : -1;
        const next = Math.min(sceneBlocks.length - 1, Math.max(0, activeScene + delta));
        const id = sceneBlocks[next]?.block.id;
        if (id) document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
      } else if (e.key === ' ' && audio.narration?.episodeId === ep.id) {
        e.preventDefault();
        audio.narration.playing ? audio.pauseNarration() : audio.resumeNarration();
      } else if (e.key === 'c') {
        patchSettings({ cinematic: !settings.cinematic });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ep, activeScene, sceneBlocks, audio, settings.cinematic, patchSettings]);

  // Konami easter egg, activated only by episode metadata.
  useEffect(() => {
    if (!ep?.easterEggs?.some((e) => e.trigger === 'konami')) return;
    const seq = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight'];
    let at = 0;
    const onKey = (e: KeyboardEvent) => {
      at = e.key === seq[at] ? at + 1 : e.key === seq[0] ? 1 : 0;
      if (at === seq.length) {
        at = 0;
        setEggText(ep.easterEggs!.find((x) => x.trigger === 'konami')!.text);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [ep]);

  // Mark completed when the chapter-end block becomes visible.
  useEffect(() => {
    if (!ep) return;
    const end = document.querySelector('.r-chapter-end');
    if (!end) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) progress.markCompleted(ep.id);
      },
      { threshold: 0.8 }
    );
    obs.observe(end);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ep?.id]);

  if (!ep) return <NotFoundPage />;

  const neighbors = neighborsOf(ep);
  const cover = assetUrl(ep.dir, ep.coverImage);
  const toc = tocFromBlocks(ep.blocks);
  const epProgress = progress.episodeProgress(ep.id);

  const ctx: BlockRenderContext = {
    ep,
    sceneIndices,
    activeScene,
    activeWord,
    onListen: (i: number, startAt?: number) => {
      const n = audio.narration;
      if (startAt === undefined && n?.episodeId === ep?.id && n.sceneIndex === i && !n.unavailable) {
        if (n.playing) audio.pauseNarration();
        else audio.resumeNarration();
        return;
      }
      playScene(i, startAt);
    },
    onSeekWord: seekWord
  };

  return (
    <div
      ref={rootRef}
      className={`reader${settings.cinematic ? ' is-cinematic' : ''}`}
      data-reader-theme={settings.theme}
      dir={dir}
      lang={ep.language ?? 'en'}
      style={
        {
          '--reader-fs': `${(1.12 * settings.fontScale).toFixed(3)}rem`,
          '--reader-lh': settings.lineHeight,
          '--reader-measure': WIDTHS[settings.width]
        } as React.CSSProperties
      }
    >
      <div className="reader-progress" aria-hidden="true">
        <div style={{ inlineSize: `${epProgress?.percentRead ?? 0}%` }} />
      </div>

      <header className="reader-header">
        <div className="reader-header-inner">
          <Link to="/story" className="reader-back">
            ← {t(lang, 'backToStory')}
          </Link>
          <div className="reader-titlebox">
            <span className="reader-kicker">
              {ep.season?.title} · {ep.subtitle ?? `#${ep.number}`}
            </span>
            <h1 className="reader-title">{ep.title}</h1>
            <span className="reader-meta">
              {ep.readingTimeMinutes} {t(lang, 'minutes')}
              {sceneBlocks.length > 0 && ` · ${sceneBlocks.length} ${t(lang, 'scenes')}`}
              {ep.placeholder && <em className="badge-placeholder"> · placeholder</em>}
            </span>
          </div>
          <div className="reader-actions">
            <button type="button" onClick={() => setShowToc((v) => !v)} aria-label={t(lang, 'tableOfContents')}>
              ☰
            </button>
            <button type="button" onClick={() => setShowSettings((v) => !v)} aria-label={t(lang, 'readingSettings')}>
              Aa
            </button>
            <button
              type="button"
              onClick={() => progress.toggleFavorite(ep.id)}
              aria-pressed={progress.isFavorite(ep.id)}
              aria-label={t(lang, 'favorite')}
              className={progress.isFavorite(ep.id) ? 'is-on' : ''}
            >
              {progress.isFavorite(ep.id) ? '★' : '☆'}
            </button>
            <button
              type="button"
              onClick={() => patchSettings({ cinematic: !settings.cinematic })}
              aria-label={settings.cinematic ? t(lang, 'exitCinematic') : t(lang, 'cinematicMode')}
            >
              ⛶
            </button>
          </div>
        </div>
        {showSettings && <ReaderSettingsPanel lang={lang} settings={settings} onChange={patchSettings} />}
      </header>

      <TableOfContents items={toc} lang={lang} open={showToc} onClose={() => setShowToc(false)} />

      {settings.cinematic && (
        <button type="button" className="cinematic-exit" onClick={() => patchSettings({ cinematic: false })}>
          ✕
        </button>
      )}

      {cover && !settings.cinematic && (
        <div className="reader-hero">
          <img src={cover} alt="" aria-hidden="true" />
          <div className="reader-hero-veil" />
        </div>
      )}

      {ep.description && !settings.cinematic && <p className="reader-lede">{ep.description}</p>}

      <article className="reader-body">
        <BlockList blocks={ep.blocks} ctx={ctx} />
      </article>

      <footer className="reader-footer-nav">
        {neighbors.prev ? (
          <Link to={`/story/${neighbors.prev.seasonId}/${neighbors.prev.id}`} className="rnav rnav-prev">
            <span className="rnav-dir">← {t(lang, 'previousEpisode')}</span>
            <span className="rnav-title">{neighbors.prev.title}</span>
          </Link>
        ) : (
          <span />
        )}
        {neighbors.next ? (
          <Link to={`/story/${neighbors.next.seasonId}/${neighbors.next.id}`} className="rnav rnav-next">
            <span className="rnav-dir">{t(lang, 'nextEpisode')} →</span>
            <span className="rnav-title">{neighbors.next.title}</span>
          </Link>
        ) : (
          <span />
        )}
      </footer>

      {eggText && (
        <div className="egg-overlay" role="dialog" aria-label="Hidden content">
          <div className="egg-card">
            <p>{eggText}</p>
            <button type="button" className="chip-btn" onClick={() => setEggText(null)}>
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
