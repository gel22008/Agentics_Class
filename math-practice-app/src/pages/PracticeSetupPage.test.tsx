import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import PracticeSetupPage from './PracticeSetupPage'

function SessionProbe() {
  const location = useLocation()
  return <pre data-testid="session-state">{JSON.stringify(location.state)}</pre>
}

function renderSetup() {
  return render(
    <MemoryRouter initialEntries={['/practice/setup']}>
      <Routes>
        <Route path="/practice/setup" element={<PracticeSetupPage />} />
        <Route path="/practice/session" element={<SessionProbe />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PracticeSetupPage', () => {
  it('starts with addition, beginner and 10 questions selected', () => {
    renderSetup()
    expect(screen.getByRole('checkbox', { name: /Addition/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Subtraction/ })).not.toBeChecked()
    expect(screen.getByRole('radio', { name: /Beginner/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /10 questions/ })).toBeChecked()
  })

  it('lets the child pick several operations and select all at once', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: /Division/ }))
    expect(screen.getByRole('checkbox', { name: /Division/ })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /Addition/ })).toBeChecked()

    await user.click(screen.getByRole('button', { name: 'Select All Operations' }))
    for (const name of ['Addition', 'Subtraction', 'Multiplication', 'Division']) {
      expect(screen.getByRole('checkbox', { name: new RegExp(name) })).toBeChecked()
    }
  })

  it('disables Start Session and explains why when no operation is selected', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: /Addition/ }))
    expect(screen.getByRole('button', { name: 'Start Session' })).toBeDisabled()
    expect(screen.getByRole('alert')).toHaveTextContent('Pick at least one operation')
  })

  it('allows only one difficulty at a time', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('radio', { name: /Advanced/ }))
    expect(screen.getByRole('radio', { name: /Advanced/ })).toBeChecked()
    expect(screen.getByRole('radio', { name: /Beginner/ })).not.toBeChecked()
  })

  it('passes the chosen configuration to the practice session', async () => {
    const user = userEvent.setup()
    renderSetup()
    await user.click(screen.getByRole('checkbox', { name: /Multiplication/ }))
    await user.click(screen.getByRole('radio', { name: /Intermediate/ }))
    await user.click(screen.getByRole('radio', { name: /Keep going/ }))
    await user.click(screen.getByRole('button', { name: 'Start Session' }))

    const state = JSON.parse(screen.getByTestId('session-state').textContent ?? '{}')
    expect(state.config).toEqual({
      operations: ['addition', 'multiplication'],
      difficulty: 'intermediate',
      sessionLength: 'continuous',
      mode: 'regular',
    })
  })
})
