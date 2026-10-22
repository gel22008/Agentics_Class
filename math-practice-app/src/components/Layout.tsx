import { useRef } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { NavigationGuardContext, type NavigationGuard } from '../hooks/navigationGuard'
import ErrorBoundary from './ErrorBoundary'
import Header from './Header'
import StorageWarning from './StorageWarning'

/** Shared frame for every page: header + navigation on top, page content below. */
function Layout() {
  // The active page (e.g. a practice session) can register a guard here.
  const guardRef = useRef<NavigationGuard | null>(null)
  // Keyed by page so moving to another page clears a previous error.
  const { pathname } = useLocation()
  return (
    <NavigationGuardContext.Provider value={guardRef}>
      <div className="app-shell">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <Header />
        <main id="main-content" className="app-main" tabIndex={-1}>
          <StorageWarning />
          <ErrorBoundary key={pathname}>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </NavigationGuardContext.Provider>
  )
}

export default Layout
