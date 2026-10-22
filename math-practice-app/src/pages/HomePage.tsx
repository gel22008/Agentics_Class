import { Link } from 'react-router-dom'

const OPERATION_TILES = [
  { symbol: '+', label: 'Add', className: 'tile--add' },
  { symbol: '−', label: 'Subtract', className: 'tile--subtract' },
  { symbol: '×', label: 'Multiply', className: 'tile--multiply' },
  { symbol: '÷', label: 'Divide', className: 'tile--divide' },
]

function HomePage() {
  return (
    <section className="home" aria-labelledby="home-title">
      <div className="home__hero">
        <p className="home__eyebrow">Welcome, math explorer!</p>
        <h1 id="home-title" className="home__title">
          Ready to become a math star? <span aria-hidden="true">⭐</span>
        </h1>
        <p className="home__intro">
          Practice adding, subtracting, multiplying and dividing with flip cards. Pick your level,
          answer questions at your own pace, and watch yourself get better every day.
        </p>

        <ul className="home__tiles" aria-label="Operations you can practice">
          {OPERATION_TILES.map((tile) => (
            <li key={tile.label} className={`tile ${tile.className}`}>
              <span className="tile__symbol" aria-hidden="true">
                {tile.symbol}
              </span>
              <span className="tile__label">{tile.label}</span>
            </li>
          ))}
        </ul>

        <div className="home__actions">
          <Link to="/practice/setup" className="btn btn--primary btn--large">
            Start Practice
          </Link>
          <Link to="/statistics" className="btn btn--secondary">
            View Statistics
          </Link>
          <Link to="/settings" className="btn btn--secondary">
            Settings
          </Link>
        </div>
      </div>
    </section>
  )
}

export default HomePage
