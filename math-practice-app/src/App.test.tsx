import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App', () => {
  it('shows the application title and main navigation on every page', () => {
    renderAt('/')
    expect(screen.getByRole('link', { name: /math practice/i })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: 'Main' })
    for (const label of ['Home', 'Practice', 'Statistics', 'Settings']) {
      expect(within(nav).getByRole('link', { name: new RegExp(label) })).toBeInTheDocument()
    }
  })

  it('shows the home page welcome and its three buttons', () => {
    renderAt('/')
    const main = screen.getByRole('main')
    expect(within(main).getByRole('heading', { level: 1, name: /math star/i })).toBeInTheDocument()
    expect(within(main).getByRole('link', { name: 'Start Practice' })).toHaveAttribute(
      'href',
      '/practice/setup',
    )
    expect(within(main).getByRole('link', { name: 'View Statistics' })).toHaveAttribute(
      'href',
      '/statistics',
    )
    expect(within(main).getByRole('link', { name: 'Settings' })).toHaveAttribute(
      'href',
      '/settings',
    )
  })

  it('navigates to practice setup when Start Practice is clicked', async () => {
    renderAt('/')
    await userEvent.click(
      within(screen.getByRole('main')).getByRole('link', { name: 'Start Practice' }),
    )
    expect(screen.getByRole('heading', { level: 1, name: 'Practice Setup' })).toBeInTheDocument()
  })

  it('marks the Practice nav item as current on any practice page', () => {
    renderAt('/practice/session')
    const nav = screen.getByRole('navigation', { name: 'Main' })
    expect(within(nav).getByRole('link', { name: /Practice/ })).toHaveAttribute(
      'aria-current',
      'page',
    )
  })

  it('shows a friendly fallback page for unknown routes', () => {
    renderAt('/this-page-does-not-exist')
    expect(screen.getByRole('heading', { level: 1, name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/')
  })
})
