import type { ResultTotals } from '../types'

interface ResultTotalsCardProps {
  title: string
  icon?: string
  totals: ResultTotals
  className?: string
}

/** A box showing Attempted / Correct / Incorrect / Accuracy for one group. */
function ResultTotalsCard({ title, icon, totals, className = '' }: ResultTotalsCardProps) {
  return (
    <article className={`result-card ${className}`.trim()} aria-label={title}>
      <h3 className="result-card__title">
        {icon && (
          <span className="result-card__icon" aria-hidden="true">
            {icon}
          </span>
        )}
        {title}
      </h3>
      <dl className="result-card__stats">
        <div>
          <dt>Attempted</dt>
          <dd>{totals.attempted}</dd>
        </div>
        <div>
          <dt>Correct</dt>
          <dd>{totals.correct}</dd>
        </div>
        <div>
          <dt>Incorrect</dt>
          <dd>{totals.incorrect}</dd>
        </div>
        <div>
          <dt>Accuracy</dt>
          <dd>{totals.attempted === 0 ? '–' : `${totals.accuracy}%`}</dd>
        </div>
      </dl>
    </article>
  )
}

export default ResultTotalsCard
