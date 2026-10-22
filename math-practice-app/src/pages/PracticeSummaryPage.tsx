import { Link, useLocation, useNavigate } from 'react-router-dom'
import PageContainer from '../components/PageContainer'
import { ROUTES } from '../routes'
import type { PracticeConfig, SessionSummary } from '../types'
import { DIFFICULTY_LABELS, OPERATION_LABELS } from '../types'
import { sessionLengthLabel } from '../utils/format'
import { isSessionSummary } from '../utils/validation'

function headline(summary: SessionSummary): string {
  if (summary.attempted === 0) return 'Session ended'
  if (summary.accuracy >= 90) return 'Amazing work! 🌟'
  if (summary.accuracy >= 70) return 'Great job! 🎉'
  if (summary.accuracy >= 50) return 'Good effort! 💪'
  return 'Keep practicing, you are learning! 🌱'
}

function PracticeSummaryPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const summary = (location.state as { summary?: unknown } | null)?.summary

  if (!isSessionSummary(summary)) {
    return (
      <PageContainer
        title="No session to show"
        subtitle="Finish a practice session to see your summary here."
        width="narrow"
      >
        <div className="page__actions">
          <Link to={ROUTES.practiceSetup} className="btn btn--primary">
            Start Practice
          </Link>
          <Link to={ROUTES.home} className="btn btn--secondary">
            Return Home
          </Link>
        </div>
      </PageContainer>
    )
  }

  const practiceAgain = () => {
    const config: PracticeConfig = {
      operations: summary.operations,
      difficulty: summary.difficulty,
      sessionLength: summary.sessionLength,
      mode: 'regular',
    }
    navigate(ROUTES.practiceSession, { state: { config } })
  }

  // Mistake review arrives in Phase 14; until then explain why the button is disabled.
  const mistakesDisabledReason =
    summary.incorrect === 0
      ? 'Disabled because you have no mistakes to review!'
      : 'Mistake review is coming soon.'

  return (
    <PageContainer
      title={headline(summary)}
      subtitle={summary.completedAt && summary.attempted > 0 ? 'Here is how you did.' : undefined}
    >
      <div className="summary-grid">
        <div className="stat-tile">
          <span className="stat-tile__value">{summary.attempted}</span>
          <span className="stat-tile__label">Attempted</span>
        </div>
        <div className="stat-tile stat-tile--correct">
          <span className="stat-tile__value">{summary.correct}</span>
          <span className="stat-tile__label">Correct</span>
        </div>
        <div className="stat-tile stat-tile--incorrect">
          <span className="stat-tile__value">{summary.incorrect}</span>
          <span className="stat-tile__label">Incorrect</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{summary.accuracy}%</span>
          <span className="stat-tile__label">Accuracy</span>
        </div>
      </div>

      <dl className="details-list">
        <dt>Operations</dt>
        <dd>{summary.operations.map((op) => OPERATION_LABELS[op]).join(', ')}</dd>
        <dt>Difficulty</dt>
        <dd>{DIFFICULTY_LABELS[summary.difficulty]}</dd>
        <dt>Session length</dt>
        <dd>{sessionLengthLabel(summary.sessionLength)}</dd>
        <dt>Mistake-review questions</dt>
        <dd>{summary.reviewQuestionCount}</dd>
      </dl>

      <div className="page__actions">
        <button type="button" className="btn btn--primary" onClick={practiceAgain}>
          Practice Again
        </button>
        <div className="action-with-reason">
          <button
            type="button"
            className="btn btn--secondary"
            disabled
            aria-describedby="mistakes-disabled-reason"
          >
            Practice Mistakes
          </button>
          <span id="mistakes-disabled-reason" className="disabled-reason">
            {mistakesDisabledReason}
          </span>
        </div>
        <Link to={ROUTES.practiceSetup} className="btn btn--secondary">
          Change Settings
        </Link>
        <Link to={ROUTES.statistics} className="btn btn--secondary">
          View Statistics
        </Link>
        <Link to={ROUTES.home} className="btn btn--secondary">
          Return Home
        </Link>
      </div>
    </PageContainer>
  )
}

export default PracticeSummaryPage
