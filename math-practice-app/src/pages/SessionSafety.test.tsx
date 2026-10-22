import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { loadActiveSession, loadAttempts, loadSessions } from '../services/practiceStore'
import type { PracticeConfig } from '../types'

const config: PracticeConfig = {
  operations: ['addition'],
  difficulty: 'beginner',
  sessionLength: 5,
  mode: 'regular',
}

function renderSessionAt(key = 'session-1') {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/practice/session', state: { config }, key }]}>
      <App />
    </MemoryRouter>,
  )
}

async function answerOne(user: ReturnType<typeof userEvent.setup>) {
  const front = await screen.findByRole('region', { name: 'Question card' })
  await user.click(within(front).getAllByRole('button', { name: /^Answer \d/ })[0])
  await user.click(within(front).getByRole('button', { name: /Flip Card/ }))
  const back = screen.getByRole('region', { name: 'Answer card' })
  await user.click(within(back).getByRole('button', { name: /I Got It Wrong/ }))
  if (within(back).queryByRole('alert')) {
    await user.click(within(back).getByRole('button', { name: /I Got It Wrong/ }))
  }
}

describe('session safety', () => {
  it('saves the session after every answer, so history matches the saved answers', async () => {
    const user = userEvent.setup()
    renderSessionAt()
    await answerOne(user)
    expect(loadAttempts()).toHaveLength(1)
    expect(loadSessions()).toHaveLength(1)
    expect(loadSessions()[0]).toMatchObject({ attempted: 1, incorrect: 1, status: 'active' })
  })

  it('asks before leaving through the nav bar, and can keep practicing', async () => {
    const user = userEvent.setup()
    renderSessionAt()
    await answerOne(user)

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('link', { name: /Statistics/ }))
    const dialog = screen.getByRole('alertdialog', { name: 'Leave this practice session?' })
    await user.click(within(dialog).getByRole('button', { name: 'Keep Practicing' }))

    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 5 completed')).toBeInTheDocument()
  })

  it('ends and saves the session, then goes where the child clicked', async () => {
    const user = userEvent.setup()
    renderSessionAt()
    await answerOne(user)

    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('link', { name: /Statistics/ }))
    await user.click(screen.getByRole('button', { name: 'End Session and Save' }))

    expect(screen.getByRole('heading', { level: 1, name: 'Statistics' })).toBeInTheDocument()
    expect(loadSessions()[0]).toMatchObject({ attempted: 1, status: 'ended-early' })
    expect(loadActiveSession()).toBeNull()
    expect(screen.getByText(/Ended early/)).toBeInTheDocument()
  })

  it('does not ask when no question has been answered yet', async () => {
    const user = userEvent.setup()
    renderSessionAt()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    await user.click(within(nav).getByRole('link', { name: /Home/ }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: /math star/i })).toBeInTheDocument()
  })

  it('restores the session after a page refresh', async () => {
    const user = userEvent.setup()
    const first = renderSessionAt('same-page')
    await answerOne(user)
    expect(screen.getByText('1 of 5 completed')).toBeInTheDocument()

    // Simulate a refresh: throw the page away and load the same history entry again.
    first.unmount()
    renderSessionAt('same-page')
    expect(screen.getByText('1 of 5 completed')).toBeInTheDocument()
    expect(screen.getAllByText('Question 2 of 5')[0]).toBeInTheDocument()
  })

  it('shows the operations actually practiced in a session', async () => {
    const user = userEvent.setup()
    renderSessionAt()
    await answerOne(user)
    expect(loadSessions()[0].operations).toEqual(['addition'])
  })
})
