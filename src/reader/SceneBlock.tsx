import { useEffect, useMemo, useRef, useState } from 'react';
import { useAudio } from '../audio/AudioContext';
import { useProgress } from '../state/ProgressContext';
import { assetUrl, type Episode } from '../lib/content';
import { episodeLang, t } from '../lib/strings';

interface SceneBlockProps {
  ep: Episode;
  sceneIndex: number; // index among scene blocks
  id: string;
  title?: string;
  paragraphs: string[];
  image?: string;
  imageAlt?: string;
  narration?: { src: string; wordTimings?: number[] };
  activeWord: number; // global word index currently highlighted, -1 when none
  isActiveScene: boolean;
  onListen: (sceneIndex: number, startAt?: number) => void;
  onSeekWord: (wordIndex: number) => void;
}

/** Split a paragraph into words, preserving punctuation attached to words. */
function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export default function SceneBlock(props: SceneBlockProps) {
  const { ep, sceneIndex, id, title, paragraphs, image, imageAlt, narration } = props;
  const audio = useAudio();
  const progress = useProgress();
  const lang = episodeLang(ep.language);
  const [revealed, setRevealed] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const imgUrl = assetUrl(ep.dir, image);
  const wordsCache = useMemo(() => paragraphs.map(splitWords), [paragraphs]);
  const titleWords = useMemo(() => (title ? splitWords(title) : []), [title]);
  const hasSync = Boolean(narration?.wordTimings?.length);

  useEffect(() => {
    setBookmarked(progress.data.bookmarks.some((b) => b.episodeId === ep.id && b.anchor === id));
  }, [progress.data.bookmarks, ep.id, id]);

  // Running word index across title + paragraphs.
  let running = 0;
  const renderWords = (words: string[], inTitle = false) =>
    words.map((w, i) => {
      const idx = running++;
      const highlighted = props.isActiveScene && hasSync && props.activeWord === idx;
      const clickable = hasSync && narration;
      return (
        <span
          key={i}
          className={`w${highlighted ? ' w-on' : ''}${clickable ? ' w-click' : ''}`}
          data-word={idx}
          onClick={clickable ? () => props.onSeekWord(idx) : undefined}
          role={clickable ? 'button' : undefined}
          tabIndex={clickable ? 0 : undefined}
          onKeyDown={
            clickable
              ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    props.onSeekWord(idx);
                  }
                }
              : undefined
          }
        >
          {w}
          {inTitle || i < words.length - 1 ? ' ' : ''}
        </span>
      );
    });

  const toggleBookmark = () => {
    if (bookmarked) {
      const bm = progress.data.bookmarks.find((b) => b.episodeId === ep.id && b.anchor === id);
      if (bm) progress.removeBookmark(bm.id);
    } else {
      progress.addBookmark({
        episodeId: ep.id,
        anchor: id,
        excerpt: (title ? `${title} - ` : '') + (paragraphs[0]?.slice(0, 90) ?? '')
      });
    }
  };

  const thisSceneNarrating =
    audio.narration?.episodeId === ep.id && audio.narration?.sceneIndex === sceneIndex;

  return (
    <section className="scene" id={id} data-scene={sceneIndex} aria-label={title ?? `Scene ${sceneIndex + 1}`}>
      <header className="scene-head">
        <span className="scene-num" aria-hidden="true">
          {String(sceneIndex + 1).padStart(2, '0')}
        </span>
        {title && <h2 className="scene-title">{hasSync ? renderWords(titleWords, true) : title}</h2>}
        <div className="scene-actions">
          {narration && (
            <button
              type="button"
              className="chip-btn"
              onClick={() => props.onListen(sceneIndex)}
              aria-label={`${t(lang, 'listenFromHere')}: ${title ?? sceneIndex + 1}`}
            >
              {thisSceneNarrating && audio.narration?.playing ? '❚❚' : '▶'} {t(lang, 'listenFromHere')}
            </button>
          )}
          <button
            type="button"
            className={`chip-btn${bookmarked ? ' is-on' : ''}`}
            onClick={toggleBookmark}
            aria-pressed={bookmarked}
          >
            {bookmarked ? `✓ ${t(lang, 'bookmarked')}` : t(lang, 'bookmarkThis')}
          </button>
        </div>
      </header>
      {imgUrl && (
        <figure className={`scene-fig${revealed ? ' is-revealed' : ''}`}>
          <img
            src={imgUrl}
            alt={imageAlt ?? ''}
            loading="lazy"
            onLoad={() => setRevealed(true)}
          />
          {imageAlt && <figcaption className="sr-only">{imageAlt}</figcaption>}
        </figure>
      )}
      {paragraphs.map((p, pi) => (
        <p key={pi} className="scene-para">
          {hasSync ? renderWords(wordsCache[pi]) : p}
        </p>
      ))}
      {thisSceneNarrating && audio.narration?.unavailable && (
        <p className="audio-note" role="status">
          {t(lang, 'audioUnavailable')}
        </p>
      )}
    </section>
  );
}
