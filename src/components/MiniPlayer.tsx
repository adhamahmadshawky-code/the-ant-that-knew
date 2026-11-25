import { Link, useLocation } from 'react-router-dom';
import { useAudio } from '../audio/AudioContext';

export default function MiniPlayer() {
  const audio = useAudio();
  const location = useLocation();
  const n = audio.narration;

  if (!n) return null;
  // On the episode's own reader page the full player is present instead.
  if (location.pathname.includes(`/story/`) && location.pathname.includes(n.episodeId)) return null;

  const pct = n.duration > 0 ? Math.min(100, (n.currentTime / n.duration) * 100) : 0;

  return (
    <div className="mini-player" role="region" aria-label="Narration mini player">
      <div className="mini-progress" style={{ inlineSize: `${pct}%` }} />
      <button
        type="button"
        className="mini-play"
        onClick={() => (n.playing ? audio.pauseNarration() : audio.resumeNarration())}
        aria-label={n.playing ? 'Pause narration' : 'Resume narration'}
      >
        {n.playing ? '❚❚' : '▶'}
      </button>
      <div className="mini-info">
        <span className="mini-title">{n.episodeTitle}</span>
        <span className="mini-scene">
          {n.sceneLabel ?? `Scene ${n.sceneIndex + 1}`} · {n.sceneIndex + 1}/{n.sceneCount}
        </span>
      </div>
      <Link className="mini-open" to={`/story/${n.seasonId}/${n.episodeId}`}>
        Open reader
      </Link>
      <button type="button" className="mini-close" onClick={audio.stopNarration} aria-label="Stop narration">
        ✕
      </button>
    </div>
  );
}
