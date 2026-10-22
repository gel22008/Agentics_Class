import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import {
  loadAttempts,
  loadSessions,
  loadSettings,
  saveAttempt,
  saveSession,
  saveSettings,
} from '../services/practiceStore'
import { buildQuestion } from '../services/questionGenerator'
import { DEFAULT_SETTINGS } from '../types'
import {
  buildAttempt,
  createSession,
  finishSession,
  recordResult,
  summarizeSession,
} from '../utils/session'
import StatisticsPage from './StatisticsPage'

function seedPractice() {
  let session = createSession({
    operations: ['addition', 'multiplication'],
    difficulty: 'easy',
    sessionLength: 5,
    mode: 'regular',
  })
  const answers: [ReturnType<typeof buildQuestion>, boolean][] = [
    [buildQuestion('addition', 'easy', 3, 4), true],
    [buildQuestion('multiplication', 'easy', 8, 7), false],
    [buildQuestion('multiplication', 'easy', 8, 7), false],
    [buildQuestion('addition', 'easy', 9, 9), true],
  ]
  for (const [question, right] of answers) {
    saveAttempt(buildAttempt(session, question, 0, right))
    session = recordResult(session, question, right)
  }
  saveSession(summarizeSession(finishSession(session, 'completed')))
}

const renderPage = () =>
  render(
    <MemoryRouter>
      <StatisticsPage />
    </MemoryRouter>,
  )

describe('StatisticsPage', () => {
  it('shows an empty state for new users and disables Practice Mistakes with a reason', () => {
    renderPage()
    expect(screen.getByText('No practice yet!')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toBeDisabled()
    expect(screen.getByText("Disabled because you haven't started yet.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset Statistics' })).toBeDisabled()
  })

  it('shows overall, operation, difficulty and recent-session statistics', () => {
    seedPractice()
    renderPage()

    const overview = screen.getByRole('region', { name: 'Overview' })
    expect(within(overview).getByText('Total Attempted').previousElementSibling).toHaveTextContent(
      '4',
    )
    expect(within(overview).getByText('Overall Accuracy').previousElementSibling).toHaveTextContent(
      '50%',
    )

    const multiplication = screen.getByRole('article', { name: 'Multiplication' })
    expect(within(multiplication).getByText('Incorrect').nextElementSibling).toHaveTextContent('2')
    expect(within(multiplication).getByText('Accuracy').nextElementSibling).toHaveTextContent('0%')

    const easy = screen.getByRole('article', { name: 'Level 2: Easy' })
    expect(within(easy).getByText('Attempted').nextElementSibling).toHaveTextContent('4')

    const missed = screen.getByRole('region', { name: 'Frequently Missed Areas' })
    expect(within(missed).getByText(/Multiplication/)).toBeInTheDocument()
    expect(within(missed).getByText('8 × 7')).toBeInTheDocument()
    expect(within(missed).getByText('missed 2 times')).toBeInTheDocument()

    const recent = screen.getByRole('region', { name: 'Recent Sessions' })
    expect(within(recent).getAllByRole('listitem')).toHaveLength(1)
  })

  it('resets statistics after confirmation but keeps settings', async () => {
    const user = userEvent.setup()
    seedPractice()
    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 5 })
    renderPage()

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Reset your statistics?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep My Statistics' }))
    expect(loadAttempts()).toHaveLength(4)

    await user.click(screen.getByRole('button', { name: 'Reset Statistics' }))
    await user.click(screen.getByRole('button', { name: 'Yes, Reset Statistics' }))
    expect(loadAttempts()).toEqual([])
    expect(loadSessions()).toEqual([])
    expect(loadSettings().masteryThreshold).toBe(5)
    expect(screen.getByText('No practice yet!')).toBeInTheDocument()
  })
})
