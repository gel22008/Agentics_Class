import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SettingsProvider from '../components/SettingsProvider'
import { loadAttempts, loadSettings, saveAttempt, saveSettings } from '../services/practiceStore'
import { buildQuestion } from '../services/questionGenerator'
import { DEFAULT_SETTINGS } from '../types'
import { buildAttempt, createSession } from '../utils/session'
import PracticeSetupPage from './PracticeSetupPage'
import SettingsPage from './SettingsPage'

function renderApp(path = '/settings') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SettingsProvider>
        <Routes>
          <Route path="/" element={<h1>Home</h1>} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/practice/setup" element={<PracticeSetupPage />} />
        </Routes>
      </SettingsProvider>
    </MemoryRouter>,
  )
}

describe('SettingsPage', () => {
  it('saves toggles automatically', async () => {
    const user = userEvent.setup()
    renderApp()
    const explanations = screen.getByRole('switch', { name: /Show explanations/ })
    expect(explanations).toBeChecked()
    await user.click(explanations)
    expect(explanations).not.toBeChecked()
    expect(loadSettings().showExplanations).toBe(false)
    expect(screen.getByText('Saved ✓')).toBeInTheDocument()

    await user.click(screen.getByRole('switch', { name: /Card animation/ }))
    expect(loadSettings().cardAnimation).toBe(false)
  })

  it('changes the mastery threshold within 1–10', async () => {
    const user = userEvent.setup()
    renderApp()
    await user.click(screen.getByRole('button', { name: 'Increase mastery threshold' }))
    expect(loadSettings().masteryThreshold).toBe(4)
    expect(screen.getByLabelText('Mastery threshold')).toHaveValue(4)

    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 1 })
  })

  it('does not allow the decrease button below 1', () => {
    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 1 })
    renderApp()
    expect(screen.getByRole('button', { name: 'Decrease mastery threshold' })).toBeDisabled()
  })

  it('uses practice defaults on the setup page', async () => {
    const user = userEvent.setup()
    saveSettings({
      ...DEFAULT_SETTINGS,
      defaultOperations: ['subtraction', 'division'],
      defaultDifficulty: 'advanced',
      defaultSessionLength: 20,
    })
    renderApp('/practice/setup')
    expect(screen.getByRole('checkbox', { name: /Subtraction/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Division/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Addition/ })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /20 questions/ })).toBeChecked()
    // Defaults can still be changed for one session.
    await user.click(screen.getByRole('radio', { name: /Beginner/ }))
    expect(screen.getByRole('radio', { name: /Beginner/ })).toBeChecked()
    expect(loadSettings().defaultDifficulty).toBe('advanced')
  })

  it('keeps at least one default operation', async () => {
    const user = userEvent.setup()
    renderApp()
    const defaults = screen.getByRole('region', { name: 'Practice Defaults' })
    await user.click(within(defaults).getByRole('checkbox', { name: /Addition/ }))
    expect(screen.getByText('Keep at least one operation selected.')).toBeInTheDocument()
    expect(loadSettings().defaultOperations).toEqual(['addition'])
  })

  it('clears all data only after a strong confirmation', async () => {
    const user = userEvent.setup()
    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 7 })
    saveAttempt(
      buildAttempt(
        createSession({
          operations: ['addition'],
          difficulty: 'easy',
          sessionLength: 5,
          mode: 'regular',
        }),
        buildQuestion('addition', 'easy', 1, 1),
        2,
        true,
      ),
    )
    renderApp()

    await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }))
    await user.click(screen.getByRole('button', { name: 'No, Keep My Data' }))
    expect(loadAttempts()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: 'Clear All Application Data' }))
    await user.click(screen.getByRole('button', { name: 'Yes, Delete Everything' }))
    expect(loadAttempts()).toEqual([])
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })
})
