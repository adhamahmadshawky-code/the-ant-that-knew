import { Link } from 'react-router-dom';
import { episodeCover, type Episode } from '../lib/content';
import { useProgress } from '../state/ProgressContext';

export default function EpisodeCard({ ep }: { ep: Episode }) {
  const progress = useProgress();
  const p = progress.episodeProgress(ep.id);
  const cover = episodeCover(ep);
  return (
    <Link to={`/story/${ep.seasonId}/${ep.id}`} className="episode-card">
      {cover && (
        <div className="episode-card-cover">
          <img src={cover} alt="" loading="lazy" />
        </div>
      )}
      <div className="episode-card-body" dir={ep.direction ?? 'ltr'} lang={ep.language ?? 'en'}>
        <span className="episode-card-kicker">
          {ep.season?.title} · {ep.subtitle ?? `#${ep.number}`}
          {ep.placeholder && <em className="badge-placeholder">placeholder</em>}
        </span>
        <span className="episode-card-title">{ep.title}</span>
        <span className="episode-card-desc">{ep.description}</span>
        <span className="episode-card-meta">
          {ep.readingTimeMinutes} min
          {p?.completed ? ' · ✓ completed' : p && p.percentRead > 1 ? ` · ${p.percentRead}% read` : ''}
        </span>
        {p && p.percentRead > 1 && !p.completed && (
          <span className="episode-card-progress">
            <span style={{ inlineSize: `${p.percentRead}%` }} />
          </span>
        )}
      </div>
    </Link>
  );
}
