import { NavLink, Outlet, Link } from 'react-router-dom';
import Wordmark from './Wordmark';
import MiniPlayer from './MiniPlayer';

const navItems = [
  { to: '/story', label: 'Story' },
  { to: '/timeline', label: 'Timeline' },
  { to: '/encyclopedia', label: 'Encyclopedia' },
  { to: '/stats', label: 'My Reading' },
  { to: '/search', label: 'Search' }
];

export default function Layout() {
  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="site-header">
        <Link to="/" className="site-brand" aria-label="The Ant That Knew - home">
          <Wordmark />
        </Link>
        <nav className="site-nav" aria-label="Main">
          {navItems.map((n) => (
            <NavLink key={n.to} to={n.to} className={({ isActive }) => (isActive ? 'nav-link is-active' : 'nav-link')}>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="site-footer">
        <div className="footer-inner">
          <div>
            <Wordmark />
            <p className="footer-tag">An original story of ants, colony life, and the mysteries of consciousness.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer">
            {navItems.map((n) => (
              <NavLink key={n.to} to={n.to} className="nav-link">
                {n.label}
              </NavLink>
            ))}
          </nav>
          <div className="footer-meta">
            <p className="footer-credits">Story and world by the author. Illustrations, narration and sound produced for this telling.</p>
            <p className="footer-social" aria-label="Social links">
              <span className="footer-social-label">Social:</span> coming soon
            </p>
            <p className="footer-copy">© {new Date().getFullYear()} The Ant That Knew. All rights reserved.</p>
          </div>
        </div>
      </footer>
      <MiniPlayer />
    </div>
  );
}
