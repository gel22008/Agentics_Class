import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

describe('PracticeSummaryPage', () => {
  it('shows a friendly message with buttons when opened without session data', () => {
    render(
      <MemoryRouter initialEntries={['/practice/summary']}>
        <App />
      </MemoryRouter>,
    )
    expect(
      screen.getByRole('heading', { level: 1, name: /This session is finished/ }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'See My Statistics' })).toHaveAttribute(
      'href',
      '/statistics',
    )
    expect(screen.getByRole('link', { name: 'Return Home' })).toHaveAttribute('href', '/')
  })
})
