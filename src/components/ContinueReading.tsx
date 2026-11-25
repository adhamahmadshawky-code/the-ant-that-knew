import { Link } from 'react-router-dom';
import { getEpisodeById } from '../lib/content';
import { useProgress } from '../state/ProgressContext';

export default function ContinueReading() {
  const progress = useProgress();
  const lastId = progress.data.lastEpisodeId;
  const ep = lastId ? getEpisodeById(lastId) : undefined;
  if (!ep) return null;
  const p = progress.episodeProgress(ep.id);
  return (
    <section className="continue-reading" aria-label="Continue reading">
      <span className="section-kicker">Continue reading</span>
      <Link to={`/story/${ep.seasonId}/${ep.id}`} className="continue-card" dir={ep.direction ?? 'ltr'}>
        <span className="continue-title">{ep.title}</span>
        <span className="continue-meta">
          {p?.completed ? 'Completed - read again' : p ? `${p.percentRead}% read - pick up where you stopped` : 'Start reading'}
        </span>
      </Link>
    </section>
  );
}
