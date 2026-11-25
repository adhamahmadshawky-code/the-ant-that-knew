import { Link } from 'react-router-dom';
import { useEffect } from 'react';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = 'Not found - The Ant That Knew';
  }, []);
  return (
    <div className="page notfound">
      <h1>404</h1>
      <p>This trail goes nowhere. Even ants lose a path sometimes.</p>
      <Link to="/" className="btn btn-solid">
        Back to the colony
      </Link>
    </div>
  );
}
