import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
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
        <GlobalWordLookup />
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
