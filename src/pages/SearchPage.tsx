import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { encyclopedia, episodes } from '../lib/content';
import type { Block } from '../lib/types';

/** Light normalization so Arabic search ignores diacritics and alef forms. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه');
}

function blockText(b: Block): string {
  switch (b.type) {
    case 'paragraph':
    case 'heading':
    case 'quote':
    case 'pull-quote':
    case 'special-note':
      return b.text;
    case 'dialogue':
      return b.lines.join(' ');
    case 'scene':
      return `${b.title ?? ''} ${b.paragraphs.join(' ')}`;
    case 'spoiler':
      return b.blocks.map(blockText).join(' ');
    default:
      return '';
  }
}

interface Hit {
  kind: 'episode' | 'encyclopedia';
  id: string;
  title: string;
  snippet: string;
  to: string;
  lang?: string;
  dir?: string;
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  useEffect(() => {
    document.title = 'Search - The Ant That Knew';
  }, []);

  const hits = useMemo<Hit[]>(() => {
    const needle = norm(q.trim());
    if (needle.length < 2) return [];
    const out: Hit[] = [];
    for (const ep of episodes) {
      const hayMeta = norm(`${ep.title} ${ep.subtitle ?? ''} ${ep.description}`);
      const hayBody = norm(ep.blocks.map(blockText).join(' '));
      if (hayMeta.includes(needle) || hayBody.includes(needle)) {
        const src = ep.blocks.map(blockText).join(' ');
        const idx = norm(src).indexOf(needle);
        const snippet = idx >= 0 ? src.slice(Math.max(0, idx - 60), idx + 120) : ep.description;
        out.push({
          kind: 'episode',
          id: ep.id,
          title: `${ep.subtitle ?? `#${ep.number}`}: ${ep.title}`,
          snippet: snippet.trim(),
          to: `/story/${ep.seasonId}/${ep.id}`,
          lang: ep.language,
          dir: ep.direction
        });
      }
    }
    for (const e of encyclopedia) {
      if (norm(`${e.name} ${e.summary} ${e.body.join(' ')}`).includes(needle)) {
        out.push({
          kind: 'encyclopedia',
          id: e.id,
          title: e.name,
          snippet: e.summary,
          to: `/encyclopedia/${e.id}`,
          lang: e.language,
          dir: e.direction
        });
      }
    }
    return out;
  }, [q]);

  return (
    <div className="page">
      <header className="page-head">
        <h1>Search</h1>
        <p>Search episodes, titles, characters and story content.</p>
      </header>
      <input
        className="search-input"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="ابحث في الحكاية… / Search the story…"
        autoFocus
        aria-label="Search the story"
      />
      {q.trim().length >= 2 && (
        <p className="search-count" role="status">
          {hits.length} result{hits.length === 1 ? '' : 's'}
        </p>
      )}
      <ul className="search-results">
        {hits.map((h) => (
          <li key={`${h.kind}-${h.id}`}>
            <Link to={h.to}>
              <span className="search-kind">{h.kind === 'episode' ? 'Episode' : 'Encyclopedia'}</span>
              <span className="search-title" dir={h.dir ?? 'ltr'} lang={h.lang ?? 'en'}>
                {h.title}
              </span>
              <span className="search-snippet" dir="auto">
                …{h.snippet}…
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
