import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import StoryPage from './pages/StoryPage';
import ReaderPage from './pages/ReaderPage';
import TimelinePage from './pages/TimelinePage';
import EncyclopediaPage from './pages/EncyclopediaPage';
import EncyclopediaEntryPage from './pages/EncyclopediaEntryPage';
import StatsPage from './pages/StatsPage';
import SearchPage from './pages/SearchPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/story/:seasonId/:episodeId" element={<ReaderPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/encyclopedia" element={<EncyclopediaPage />} />
        <Route path="/encyclopedia/:entryId" element={<EncyclopediaEntryPage />} />
        <Route path="/stats" element={<StatsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
