import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { CorpusProvider } from './data/CorpusContext'
import { AppShell } from './components/layout/AppShell'
import { DashboardPage } from './pages/DashboardPage'
import { DrillPage } from './pages/DrillPage'
import { ScenarioPage } from './pages/ScenarioPage'
import { DialoguePage } from './pages/DialoguePage'
import { ListeningPage } from './pages/ListeningPage'
import { LibraryPage } from './pages/LibraryPage'
import { ChapterPage } from './pages/ChapterPage'
import { StatsPage } from './pages/StatsPage'
import { SettingsPage } from './pages/SettingsPage'
import { StoryPage } from './pages/StoryPage'
import { StoryEpisodePage } from './pages/StoryEpisodePage'
import { WordsPage } from './pages/WordsPage'
import { CareerPage } from './pages/CareerPage'
import { TypingPage } from './features/typing'
import { GlobalWordLookup } from './components/words/GlobalWordLookup'

export default function App() {
  return (
    <HashRouter>
      <CorpusProvider>
        <RouteWordLookup />
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/drill" element={<DrillPage />} />
            <Route path="/typing" element={<TypingPage />} />
            <Route path="/story" element={<StoryPage />} />
            <Route path="/story/:episodeId" element={<StoryEpisodePage />} />
            <Route path="/scenario" element={<ScenarioPage />} />
            <Route path="/dialogue" element={<DialoguePage />} />
            <Route path="/dialogue/:chapterId" element={<DialoguePage />} />
            <Route path="/listen" element={<ListeningPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:chapterId" element={<ChapterPage />} />
            <Route path="/words" element={<WordsPage />} />
            <Route path="/career" element={<CareerPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </CorpusProvider>
    </HashRouter>
  )
}

/**
 * 查词卡片是全局 portal，路由变化时用 key 强制重挂载，
 * 避免固定卡片停在上一页的位置。
 */
function RouteWordLookup() {
  const location = useLocation()
  return <GlobalWordLookup key={`${location.pathname}${location.search}`} />
}
