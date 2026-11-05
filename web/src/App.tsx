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

export default function App() {
  return (
    <HashRouter>
      <CorpusProvider>
        <AppShell>
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/drill" element={<DrillPage />} />
            <Route path="/scenario" element={<ScenarioPage />} />
            <Route path="/dialogue" element={<DialoguePage />} />
            <Route path="/dialogue/:chapterId" element={<DialoguePage />} />
            <Route path="/listen" element={<ListeningPage />} />
            <Route path="/library" element={<LibraryPage />} />
            <Route path="/library/:chapterId" element={<ChapterPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppShell>
      </CorpusProvider>
    </HashRouter>
  )
}
