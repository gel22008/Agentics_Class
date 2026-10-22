import { useLocation } from 'react-router-dom'
import GuardedLink from './GuardedLink'

interface NavItem {
  label: string
  to: string
  icon: string
  /** Path prefix that should mark this item as active (e.g. all /practice/* pages). */
  matchPrefix?: string
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: '🏠' },
  { label: 'Practice', to: '/practice/setup', icon: '✏️', matchPrefix: '/practice' },
  { label: 'Statistics', to: '/statistics', icon: '📊' },
  { label: 'Settings', to: '/settings', icon: '⚙️' },
]

/** Always-visible navigation between the four main areas of the app. */
function NavBar() {
  const { pathname } = useLocation()

  return (
    <nav className="nav" aria-label="Main">
      <ul className="nav__list">
        {NAV_ITEMS.map((item) => {
          const isActive = item.matchPrefix
            ? pathname.startsWith(item.matchPrefix)
            : pathname === item.to
          return (
            <li key={item.to}>
              {/* Link-based (not NavLink): NavLink overrides aria-current with its own
                  path matching, which misses /practice/session and /practice/summary. */}
              <GuardedLink
                to={item.to}
                className={isActive ? 'nav__link nav__link--active' : 'nav__link'}
                aria-current={isActive ? 'page' : undefined}
              >
                <span className="nav__icon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </GuardedLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

export default NavBar
