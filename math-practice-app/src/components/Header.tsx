import { Link } from 'react-router-dom'
import NavBar from './NavBar'

function Header() {
  return (
    <header className="app-header">
      <div className="app-header__inner">
        <Link to="/" className="app-title">
          <span className="app-title__plus" aria-hidden="true">
            +
          </span>{' '}
          Math Practice
        </Link>
        <NavBar />
      </div>
    </header>
  )
}

export default Header
