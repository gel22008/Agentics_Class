import { Outlet } from 'react-router-dom'
import Header from './Header'

/** Shared frame for every page: header + navigation on top, page content below. */
function Layout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>
      <Header />
      <main id="main-content" className="app-main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  )
}

export default Layout
