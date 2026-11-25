import { Link } from 'react-router-dom';
import { episodes, getEpisodeById } from '../lib/content';
import { useProgress } from '../state/ProgressContext';
import { useEffect } from 'react';

function fmt(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}

export default function StatsPage() {
  const progress = useProgress();
  useEffect(() => {
    document.title = 'My Reading - The Ant That Knew';
  }, []);
  const d = progress.data;
  const completedIds = Object.values(d.episodes).filter((e) => e.completed).map((e) => e.episodeId);
  const real = episodes.filter((e) => !e.placeholder);

  return (
    <div className="page">
      <header className="page-head">
        <h1>My Reading</h1>
        <p>Your personal reading dashboard. Stored on this device; no account needed.</p>
      </header>

      <section className="stats-cards">
        <div className="stat-card">
          <span className="stat-num">{completedIds.length}</span>
          <span className="stat-label">of {real.length} episodes completed</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{fmt(d.totalReadingSeconds)}</span>
          <span className="stat-label">total reading time</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{d.bookmarks.length}</span>
          <span className="stat-label">bookmarks</span>
        </div>
        <div className="stat-card">
          <span className="stat-num">{d.favorites.length}</span>
          <span className="stat-label">favorite episodes</span>
        </div>
      </section>

      <section className="page-section">
        <h2>Episode progress</h2>
        <ul className="progress-list">
          {real.map((ep) => {
            const p = d.episodes[ep.id];
            return (
              <li key={ep.id}>
                <Link to={`/story/${ep.seasonId}/${ep.id}`}>{ep.title}</Link>
                <span className="progress-track">
                  <span style={{ inlineSize: `${p?.percentRead ?? 0}%` }} />
                </span>
                <span className="progress-pct">{p?.completed ? '✓' : `${p?.percentRead ?? 0}%`}</span>
              </li>
            );
          })}
        </ul>
      </section>

      {d.bookmarks.length > 0 && (
        <section className="page-section">
          <h2>Bookmarks</h2>
          <ul className="bookmark-list">
            {d.bookmarks.map((b) => {
              const ep = getEpisodeById(b.episodeId);
              if (!ep) return null;
              return (
                <li key={b.id}>
                  <Link to={`/story/${ep.seasonId}/${ep.id}#${b.anchor}`}>
                    <strong>{ep.title}</strong>
                    <span className="bookmark-excerpt" dir={ep.direction ?? 'ltr'}>
                      {b.excerpt}…
                    </span>
                  </Link>
                  <button type="button" className="chip-btn" onClick={() => progress.removeBookmark(b.id)}>
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {d.history.length > 0 && (
        <section className="page-section">
          <h2>History</h2>
          <ul className="history-list">
            {d.history.slice(0, 12).map((h, i) => {
              const ep = getEpisodeById(h.episodeId);
              if (!ep) return null;
              return (
                <li key={i}>
                  <Link to={`/story/${ep.seasonId}/${ep.id}`}>{ep.title}</Link>
                  <time dateTime={h.openedAt}>{new Date(h.openedAt).toLocaleString()}</time>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
