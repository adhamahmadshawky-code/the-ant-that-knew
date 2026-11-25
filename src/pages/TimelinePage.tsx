import { Link } from 'react-router-dom';
import { getEpisodeById, timeline } from '../lib/content';
import { useEffect } from 'react';

export default function TimelinePage() {
  useEffect(() => {
    document.title = 'Timeline - The Ant That Knew';
  }, []);
  return (
    <div className="page">
      <header className="page-head">
        <h1>Story Timeline</h1>
        <p>The events of the story in chronological order.</p>
      </header>
      {timeline.length === 0 ? (
        <p className="empty-note">Timeline entries will appear as the story grows.</p>
      ) : (
        <ol className="timeline">
          {timeline.map((ev) => {
            const ep = ev.episodeId ? getEpisodeById(ev.episodeId) : undefined;
            return (
              <li key={ev.id} className="timeline-item" dir={ev.direction ?? 'ltr'} lang={ev.language ?? 'en'}>
                <span className="timeline-dot" aria-hidden="true" />
                <div className="timeline-body">
                  <h2>{ev.title}</h2>
                  <p>{ev.summary}</p>
                  {ep && (
                    <Link to={`/story/${ep.seasonId}/${ep.id}`} className="timeline-link">
                      {ev.language === 'ar' ? 'اقرأ:' : 'Read:'} {ep.title}
                    </Link>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
