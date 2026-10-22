import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import type { PracticeConfig } from '../types'
import PracticeSessionPage from './PracticeSessionPage'
import PracticeSetupPage from './PracticeSetupPage'
import PracticeSummaryPage from './PracticeSummaryPage'

function renderSession(config: unknown) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/session', state: { config } }]}>
      <Routes>
        <Route path="/practice/setup" element={<PracticeSetupPage />} />
        <Route path="/practice/session" element={<PracticeSessionPage />} />
        <Route path="/practice/summary" element={<PracticeSummaryPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const config = (overrides: Partial<PracticeConfig> = {}): PracticeConfig => ({
  operations: ['addition'],
  difficulty: 'beginner',
  sessionLength: 5,
  mode: 'regular',
  ...overrides,
})

/** Answers the current card by picking the first choice and reporting the given result. */
async function answerCard(user: ReturnType<typeof userEvent.setup>, reportRight: boolean) {
  const front = await screen.findByRole('region', { name: 'Question card' })
  await user.click(within(front).getAllByRole('button', { name: /^Answer \d/ })[0])
  await user.click(within(front).getByRole('button', { name: /Flip Card/ }))
  const back = screen.getByRole('region', { name: 'Answer card' })
  // The card may show a recheck nudge (red or green) the first time; tapping again confirms.
  const buttonName = reportRight ? /I Got It Right/ : /I Got It Wrong/
  await user.click(within(back).getByRole('button', { name: buttonName }))
  if (within(back).queryByRole('alert')) {
    await user.click(within(back).getByRole('button', { name: buttonName }))
  }
}

async function waitForNextCard(questionText: string) {
  await screen.findAllByText(
    (_, element) =>
      element?.classList.contains('card__count') === true && element.textContent === questionText,
    {},
    { timeout: 3000 },
  )
}

describe('PracticeSessionPage', () => {
  it('sends the child back to setup when there is no valid session', async () => {
    renderSession(undefined)
    expect(await screen.findByRole('heading', { name: 'Practice Setup' })).toBeInTheDocument()
    expect(screen.getByText(/Choose your practice options/)).toBeInTheDocument()
  })

  it('rejects invalid setup data', async () => {
    renderSession({ operations: [], difficulty: 'impossible', sessionLength: 7, mode: 'regular' })
    expect(await screen.findByRole('heading', { name: 'Practice Setup' })).toBeInTheDocument()
  })

  it('shows progress and moves to the next question after each result', async () => {
    const user = userEvent.setup()
    renderSession(config())
    expect(screen.getByText('0 of 5 completed')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')

    await answerCard(user, false)
    expect(screen.getByText('1 of 5 completed')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    await waitForNextCard('Question 2 of 5')
  })

  it('finishes a 5-question session and shows an accurate summary', async () => {
    const user = userEvent.setup()
    renderSession(config({ operations: ['addition', 'division'] }))
    const results = [true, false, true, true, false]
    for (let i = 0; i < results.length; i++) {
      await waitForNextCard(`Question ${i + 1} of 5`)
      await answerCard(user, results[i])
    }

    // Wait for something only the summary page has (the session page also has an h1).
    expect(await screen.findByText('Attempted', {}, { timeout: 3000 })).toBeInTheDocument()
    const tile = (label: string) => screen.getByText(label).previousElementSibling
    expect(tile('Attempted')).toHaveTextContent('5')
    expect(tile('Correct')).toHaveTextContent('3')
    expect(tile('Incorrect')).toHaveTextContent('2')
    expect(tile('Accuracy')).toHaveTextContent('60%')
    expect(screen.getByText('Addition, Division')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Practice Mistakes' })).toBeDisabled()
  }, 20000)

  it('continuous practice has no fixed total and ends with confirmation', async () => {
    const user = userEvent.setup()
    renderSession(config({ sessionLength: 'continuous' }))
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    expect(screen.getByText('0 questions answered')).toBeInTheDocument()

    await answerCard(user, true)
    await waitForNextCard('Question 2')
    expect(screen.getByText('1 question answered')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'End Session' }))
    const dialog = screen.getByRole('alertdialog', { name: 'End this session?' })

    // Keep practicing closes the dialog and stays on the session.
    await user.click(within(dialog).getByRole('button', { name: 'Keep Practicing' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'End Session' }))
    await user.click(screen.getByRole('button', { name: 'End and See Summary' }))
    expect(screen.getByText('Attempted').previousElementSibling).toHaveTextContent('1')
  })

  it('ending before answering anything returns to setup without a summary', async () => {
    const user = userEvent.setup()
    renderSession(config())
    await user.click(screen.getByRole('button', { name: 'End Session' }))
    expect(screen.getByRole('heading', { name: 'Practice Setup' })).toBeInTheDocument()
  })
})
