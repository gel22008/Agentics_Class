import GuardedLink from './GuardedLink'
import NavBar from './NavBar'

function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <GuardedLink to="/" className="app-title">
          <span className="app-title__plus" aria-hidden="true">
            +
          </span>{' '}
          Math Practice
        </GuardedLink>
        <NavBar />
      </div>
    </header>
  )
}

export default Header
