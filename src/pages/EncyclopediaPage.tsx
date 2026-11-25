import { Link } from 'react-router-dom';
import { encyclopedia } from '../lib/content';
import { useEffect } from 'react';
import type { EncyclopediaCategory } from '../lib/types';

const CATEGORY_LABELS: Record<EncyclopediaCategory, string> = {
  character: 'Characters',
  colony: 'Colonies',
  location: 'Locations',
  species: 'Species',
  concept: 'Concepts'
};

export default function EncyclopediaPage() {
  useEffect(() => {
    document.title = 'Encyclopedia - The Ant That Knew';
  }, []);
  const cats = Object.keys(CATEGORY_LABELS) as EncyclopediaCategory[];
  return (
    <div className="page">
      <header className="page-head">
        <h1>Story Encyclopedia</h1>
        <p>Characters, colonies, locations, species and concepts of the world.</p>
      </header>
      {encyclopedia.length === 0 && (
        <p className="empty-note">Encyclopedia entries will appear as the author adds them.</p>
      )}
      {cats.map((c) => {
        const entries = encyclopedia.filter((e) => e.category === c);
        if (entries.length === 0) return null;
        return (
          <section key={c} className="page-section">
            <h2 className="enc-cat">{CATEGORY_LABELS[c]}</h2>
            <div className="enc-grid">
              {entries.map((e) => (
                <Link key={e.id} to={`/encyclopedia/${e.id}`} className="enc-card" dir={e.direction ?? 'ltr'} lang={e.language ?? 'en'}>
                  <span className="enc-name">{e.name}</span>
                  <span className="enc-summary">{e.summary}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
