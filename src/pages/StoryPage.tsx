import { episodes, seasons, seasonEpisodes } from '../lib/content';
import EpisodeCard from '../components/EpisodeCard';
import { useEffect } from 'react';

export default function StoryPage() {
  useEffect(() => {
    document.title = 'Story - The Ant That Knew';
  }, []);
  return (
    <div className="page">
      <header className="page-head">
        <h1>The Story</h1>
        <p>Every published episode, season by season.</p>
      </header>
      {seasons.map((s) => {
        const eps = seasonEpisodes(s.id);
        const real = eps.filter((e) => !e.placeholder);
        const samples = eps.filter((e) => e.placeholder);
        return (
          <section key={s.id} id={s.id} className="page-section">
            <div className="season-head">
              <h2>{s.title}</h2>
              <span className="season-head-meta">
                Season {s.number} · {real.length} episode{real.length === 1 ? '' : 's'}
              </span>
              <p dir="auto">{s.description}</p>
            </div>
            {real.length === 0 && (
              <p className="empty-note">No episodes published yet. The platform is ready for them.</p>
            )}
            <div className="episode-grid">
              {real.map((e) => (
                <EpisodeCard key={e.id} ep={e} />
              ))}
            </div>
            {samples.length > 0 && (
              <>
                <h3 className="samples-head">Samples (placeholder content)</h3>
                <div className="episode-grid">
                  {samples.map((e) => (
                    <EpisodeCard key={e.id} ep={e} />
                  ))}
                </div>
              </>
            )}
          </section>
        );
      })}
      {episodes.length === 0 && (
        <p className="empty-note">Story content has not been uploaded yet. The platform is fully functional and waiting for the first episode.</p>
      )}
    </div>
  );
}
