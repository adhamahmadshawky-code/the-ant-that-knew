import { Link } from 'react-router-dom';
import { assetUrl, episodes, featuredEpisode, getEpisodeById, recentEpisodes, seasons, seasonCover, seasonEpisodes } from '../lib/content';
import { useProgress } from '../state/ProgressContext';
import EpisodeCard from '../components/EpisodeCard';
import ContinueReading from '../components/ContinueReading';
import Wordmark from '../components/Wordmark';
import { useEffect } from 'react';

export default function HomePage() {
  useEffect(() => {
    document.title = 'The Ant That Knew - an interactive story';
  }, []);
  const featured = featuredEpisode;
  const heroImg = featured ? assetUrl(featured.dir, featured.coverImage) : undefined;

  return (
    <div className="home">
      <section className="hero">
        {heroImg && (
          <div className="hero-bg" aria-hidden="true">
            <img src={heroImg} alt="" />
            <div className="hero-veil" />
          </div>
        )}
        <div className="hero-content">
          <Wordmark size="large" />
          <p className="hero-tag">
            An original story of ants, colony life, collective intelligence, and the mysteries of consciousness -
            told as an interactive, illustrated, narrated reading experience.
          </p>
          <div className="hero-actions">
            <HeroContinue />
            <Link to="/story" className="btn btn-ghost">
              Explore Story
            </Link>
          </div>
        </div>
      </section>

      <ContinueReading />

      {featured && (
        <section className="home-section">
          <span className="section-kicker">Featured episode</span>
          <div className="featured">
            {heroImg && (
              <Link to={`/story/${featured.seasonId}/${featured.id}`} className="featured-art">
                <img src={heroImg} alt={featured.title} loading="lazy" />
              </Link>
            )}
            <div className="featured-body" dir={featured.direction ?? 'ltr'} lang={featured.language ?? 'en'}>
              <span className="featured-kicker">
                {featured.season?.title} · {featured.subtitle ?? `#${featured.number}`}
              </span>
              <h2 className="featured-title">{featured.title}</h2>
              <p className="featured-desc">{featured.description}</p>
              <span className="featured-meta">{featured.readingTimeMinutes} min read</span>
              <Link to={`/story/${featured.seasonId}/${featured.id}`} className="btn btn-solid">
                Read the episode
              </Link>
            </div>
          </div>
        </section>
      )}

      <section className="home-section">
        <span className="section-kicker">Seasons</span>
        <div className="season-grid">
          {seasons.map((s) => {
            const count = seasonEpisodes(s.id).length;
            const cover = seasonCover(s);
            return (
              <Link key={s.id} to={`/story#${s.id}`} className="season-card">
                {cover && (
                  <div className="season-card-cover">
                    <img src={cover} alt="" loading="lazy" />
                  </div>
                )}
                <div className="season-card-body">
                  <span className="season-card-title">{s.title}</span>
                  <span className="season-card-count">
                    Season {s.number} · {count} episode{count === 1 ? '' : 's'}
                  </span>
                  <span className="season-card-desc" dir="auto">
                    {s.description}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {recentEpisodes.length > 0 && (
        <section className="home-section">
          <span className="section-kicker">Recently added</span>
          <div className="episode-grid">
            {recentEpisodes.map((e) => (
              <EpisodeCard key={e.id} ep={e} />
            ))}
          </div>
        </section>
      )}

      <section className="home-section about">
        <span className="section-kicker">About the story</span>
        <div className="about-body">
          <h2>A world beneath the leaves</h2>
          <p>
            THE ANT THAT KNEW (ANA) is an original fictional universe centered around ants, colony life, collective
            intelligence, survival, society, and the mysteries of consciousness. New seasons and episodes are added to
            the platform over time.
          </p>
          <p className="about-note">
            The platform is ready for the growing universe: episodes, illustrations, narration and sound are added as
            content, without touching the application itself.
          </p>
          <p className="about-count">
            {episodes.filter((e) => !e.placeholder).length} episode
            {episodes.filter((e) => !e.placeholder).length === 1 ? '' : 's'} published so far.
          </p>
        </div>
      </section>
    </div>
  );
}

function HeroContinue() {
  const progress = useProgress();
  const last = progress.data.lastEpisodeId ? getEpisodeById(progress.data.lastEpisodeId) : undefined;
  if (last) {
    return (
      <Link to={`/story/${last.seasonId}/${last.id}`} className="btn btn-solid">
        Continue Reading
      </Link>
    );
  }
  const first = episodes[0];
  return first ? (
    <Link to={`/story/${first.seasonId}/${first.id}`} className="btn btn-solid">
      Start Reading
    </Link>
  ) : (
    <Link to="/story" className="btn btn-solid">
      Explore Story
    </Link>
  );
}
