import { Link, useParams } from 'react-router-dom';
import { assetUrl, getEncyclopediaEntry, getEpisodeById } from '../lib/content';
import { useEffect } from 'react';
import NotFoundPage from './NotFoundPage';

export default function EncyclopediaEntryPage() {
  const { entryId = '' } = useParams();
  const entry = getEncyclopediaEntry(entryId);
  useEffect(() => {
    if (entry) document.title = `${entry.name} - Encyclopedia - The Ant That Knew`;
  }, [entry]);
  if (!entry) return <NotFoundPage />;
  const img = entry.image ? assetUrl(`/content/encyclopedia`, entry.image) : undefined;
  return (
    <div className="page" dir={entry.direction ?? 'ltr'} lang={entry.language ?? 'en'}>
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link to="/encyclopedia">Encyclopedia</Link> / <span>{entry.name}</span>
      </nav>
      <article className="enc-entry">
        <span className="enc-cat-label">{entry.category}</span>
        <h1>{entry.name}</h1>
        <p className="enc-lede">{entry.summary}</p>
        {img && <img className="enc-img" src={img} alt={entry.name} />}
        {entry.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
        {entry.relatedEpisodeIds && entry.relatedEpisodeIds.length > 0 && (
          <section className="enc-related">
            <h2>{entry.language === 'ar' ? 'يظهر في' : 'Appears in'}</h2>
            <ul>
              {entry.relatedEpisodeIds.map((id) => {
                const ep = getEpisodeById(id);
                if (!ep) return null;
                return (
                  <li key={id}>
                    <Link to={`/story/${ep.seasonId}/${ep.id}`}>
                      {ep.subtitle ?? `#${ep.number}`}: {ep.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </article>
    </div>
  );
}
