import { useEffect, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioContext';
import { useProgress } from '../state/ProgressContext';
import { assetUrl, type Block, type Episode } from '../lib/content';
import { episodeLang, t } from '../lib/strings';
import SceneBlock from './SceneBlock';

export interface BlockRenderContext {
  ep: Episode;
  sceneIndices: Map<number, number>; // block index -> scene index
  activeScene: number;
  activeWord: number;
  onListen: (sceneIndex: number, startAt?: number) => void;
  onSeekWord: (sceneIndex: number, wordIndex: number) => void;
}

function SoundEffectBlock({ ep, block }: { ep: Episode; block: Extract<Block, { type: 'sound-effect' }> }) {
  const audio = useAudio();
  const ref = useRef<HTMLDivElement>(null);
  const played = useRef(false);
  const src = assetUrl(ep.dir, block.src);

  useEffect(() => {
    if (block.when === 'click' || !src) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !played.current) {
          played.current = true;
          audio.playSfx(src);
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [audio, block.when, src]);

  if (!src) return null; // graceful fallback for a missing effect file
  return (
    <div ref={ref} className="sfx-block">
      {block.when === 'click' && (
        <button type="button" className="chip-btn" onClick={() => audio.playSfx(src)}>
          ♪ {block.label ?? 'Sound'}
        </button>
      )}
    </div>
  );
}

function AmbientAudioBlock({ ep, block }: { ep: Episode; block: Extract<Block, { type: 'ambient-audio' }> }) {
  const audio = useAudio();
  const ref = useRef<HTMLDivElement>(null);
  const src = assetUrl(ep.dir, block.src);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        if (block.action === 'start' && src) audio.startAmbientFile(src, block.src ?? 'ambient');
        if (block.action === 'stop') audio.stopAmbient();
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [audio, block.action, block.src, src]);

  return <div ref={ref} className="ambient-anchor" aria-hidden="true" />;
}

function SpoilerBlock({ ep, block, ctx }: { ep: Episode; block: Extract<Block, { type: 'spoiler' }>; ctx: BlockRenderContext }) {
  const progress = useProgress();
  const lang = episodeLang(ep.language);
  const [open, setOpen] = useState(false);
  const gateDone = block.untilEpisode
    ? Boolean(progress.episodeProgress(block.untilEpisode)?.completed)
    : true;

  if (!open) {
    return (
      <div className="spoiler-box">
        <p className="spoiler-label">{block.label ?? t(lang, 'spoilerHidden')}</p>
        {gateDone ? (
          <button type="button" className="chip-btn" onClick={() => setOpen(true)}>
            {t(lang, 'reveal')}
          </button>
        ) : (
          <p className="spoiler-locked">
            {lang === 'ar' ? 'يُكشف بعد إتمام الحلقة المرتبطة.' : 'Unlocks after the linked episode is completed.'}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="spoiler-box is-open">
      <BlockList blocks={block.blocks} ctx={ctx} />
    </div>
  );
}

function GalleryBlock({ ep, block }: { ep: Episode; block: Extract<Block, { type: 'gallery' }> }) {
  const [focus, setFocus] = useState(0);
  const images = block.images
    .map((im) => ({ ...im, url: assetUrl(ep.dir, im.src) }))
    .filter((im) => im.url);
  if (images.length === 0) return null;
  const current = images[Math.min(focus, images.length - 1)];
  return (
    <figure className="gallery">
      <img src={current.url} alt={current.alt} loading="lazy" />
      {current.caption && <figcaption>{current.caption}</figcaption>}
      <div className="gallery-dots" role="tablist" aria-label="Gallery">
        {images.map((im, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === focus}
            aria-label={`Image ${i + 1}`}
            className={i === focus ? 'dot is-on' : 'dot'}
            onClick={() => setFocus(i)}
          />
        ))}
      </div>
    </figure>
  );
}

export function BlockList({ blocks, ctx }: { blocks: Block[]; ctx: BlockRenderContext }) {
  const { ep } = ctx;
  const lang = episodeLang(ep.language);
  return (
    <>
      {blocks.map((b, i) => {
        const key = `b-${i}`;
        switch (b.type) {
          case 'paragraph':
            return (
              <p key={key} id={key} className="r-para">
                {b.text}
              </p>
            );
          case 'heading':
            return b.level === 3 ? (
              <h3 key={key} id={key} className="r-h3">
                {b.text}
              </h3>
            ) : (
              <h2 key={key} id={key} className="r-h2">
                {b.text}
              </h2>
            );
          case 'dialogue':
            return (
              <div key={key} id={key} className="r-dialogue">
                {b.speaker && <span className="r-speaker">{b.speaker}</span>}
                {b.lines.map((l, j) => (
                  <p key={j}>{l}</p>
                ))}
              </div>
            );
          case 'image': {
            const url = assetUrl(ep.dir, b.src);
            if (!url) return null;
            return (
              <figure key={key} id={key} className="r-fig">
                <img src={url} alt={b.alt} loading="lazy" />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          }
          case 'full-width-image': {
            const url = assetUrl(ep.dir, b.src);
            if (!url) return null;
            return (
              <figure key={key} id={key} className="r-fig-full">
                <img src={url} alt={b.alt} loading="lazy" />
                {b.caption && <figcaption>{b.caption}</figcaption>}
              </figure>
            );
          }
          case 'quote':
            return (
              <blockquote key={key} id={key} className="r-quote">
                <p>{b.text}</p>
                {b.attribution && <cite>{b.attribution}</cite>}
              </blockquote>
            );
          case 'pull-quote':
            return (
              <aside key={key} id={key} className="r-pull">
                {b.text}
              </aside>
            );
          case 'scene-break':
            return (
              <div key={key} id={key} className={`r-break r-break-${b.variant ?? 'ants'}`} aria-hidden="true">
                {b.variant === 'dots' ? '···' : b.variant === 'line' ? '' : '␥ ␥ ␥'}
              </div>
            );
          case 'audio': {
            const url = assetUrl(ep.dir, b.src);
            if (!url) {
              return (
                <p key={key} className="audio-note" role="status">
                  {t(lang, 'audioUnavailable')}
                </p>
              );
            }
            return (
              <div key={key} id={key} className="r-audio">
                {/* positioned narration/clip block */}
                <audio controls preload="none" src={url} aria-label={b.label ?? 'Audio clip'} />
                {b.label && <span className="r-audio-label">{b.label}</span>}
              </div>
            );
          }
          case 'ambient-audio':
            return <AmbientAudioBlock key={key} ep={ep} block={b} />;
          case 'sound-effect':
            return <SoundEffectBlock key={key} ep={ep} block={b} />;
          case 'gallery':
            return <GalleryBlock key={key} ep={ep} block={b} />;
          case 'special-note':
            return (
              <aside key={key} id={key} className={`r-note r-note-${b.tone ?? 'info'}`}>
                {b.text}
              </aside>
            );
          case 'scene':
            return (
              <SceneBlock
                key={key}
                ep={ep}
                sceneIndex={ctx.sceneIndices.get(i) ?? 0}
                id={b.id}
                title={b.title}
                paragraphs={b.paragraphs}
                image={b.image}
                imageAlt={b.imageAlt}
                narration={b.narration}
                activeWord={ctx.activeWord}
                isActiveScene={ctx.activeScene === (ctx.sceneIndices.get(i) ?? -1)}
                onListen={ctx.onListen}
                onSeekWord={(w) => ctx.onSeekWord(ctx.sceneIndices.get(i) ?? 0, w)}
              />
            );
          case 'spoiler':
            return <SpoilerBlock key={key} ep={ep} block={b} ctx={ctx} />;
          case 'chapter-end':
            return (
              <div key={key} id={key} className="r-chapter-end">
                <span className="r-end-mark" aria-hidden="true" />
                <p>{b.text ?? (lang === 'ar' ? 'انتهت الحلقة' : 'End of episode')}</p>
              </div>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
