import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import NotFoundPage from './pages/NotFoundPage'
import PracticeSessionPage from './pages/PracticeSessionPage'
import PracticeSetupPage from './pages/PracticeSetupPage'
import PracticeSummaryPage from './pages/PracticeSummaryPage'
import SettingsPage from './pages/SettingsPage'
import StatisticsPage from './pages/StatisticsPage'
import { ROUTES } from './routes'

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path={ROUTES.home} element={<HomePage />} />
        <Route path={ROUTES.practiceSetup} element={<PracticeSetupPage />} />
        <Route path={ROUTES.practiceSession} element={<PracticeSessionPage />} />
        <Route path={ROUTES.practiceSummary} element={<PracticeSummaryPage />} />
        <Route path={ROUTES.statistics} element={<StatisticsPage />} />
        <Route path={ROUTES.settings} element={<SettingsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App
