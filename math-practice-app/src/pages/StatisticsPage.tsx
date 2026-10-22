import { useCallback, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import MistakeDetails from '../components/MistakeDetails'
import PageContainer from '../components/PageContainer'
import PracticeMistakesButton from '../components/PracticeMistakesButton'
import ResultTotalsCard from '../components/ResultTotalsCard'
import { ROUTES } from '../routes'
import { useSettings } from '../hooks/useSettings'
import {
  clearStatistics,
  loadAttempts,
  loadMistakes,
  loadSessions,
} from '../services/practiceStore'
import { calculateStatistics } from '../services/statistics'
import {
  DIFFICULTY_LABELS,
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  OPERATION_LABELS,
  OPERATION_SYMBOLS,
} from '../types'

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
})

function formatDate(iso: string): string {
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? 'Unknown date' : dateFormatter.format(date)
}

function StatisticsPage() {
  // Bumping this re-reads storage (e.g. after a reset).
  const [version, setVersion] = useState(0)
  const [confirmResetOpen, setConfirmResetOpen] = useState(false)

  const settings = useSettings()
  const { stats, mistakes } = useMemo(() => {
    void version
    const mistakes = loadMistakes()
    return { stats: calculateStatistics(loadAttempts(), loadSessions(), mistakes), mistakes }
  }, [version])

  const hasPracticed = stats.overall.attempted > 0
  const hasMistakes = stats.overall.incorrect > 0
  const closeReset = useCallback(() => setConfirmResetOpen(false), [])
  const confirmReset = () => {
    clearStatistics()
    setConfirmResetOpen(false)
    setVersion((v) => v + 1)
  }

  return (
    <PageContainer title="Statistics" subtitle="See how your practice is going.">
      {/* ---------- Overview ---------- */}
      <section className="stats-section" aria-labelledby="overview-title">
        <h2 id="overview-title" className="stats-section__title">
          Overview
        </h2>
        {hasPracticed ? (
          <div className="summary-grid">
            <div className="stat-tile">
              <span className="stat-tile__value">{stats.overall.attempted}</span>
              <span className="stat-tile__label">Total Attempted</span>
            </div>
            <div className="stat-tile stat-tile--correct">
              <span className="stat-tile__value">{stats.overall.correct}</span>
              <span className="stat-tile__label">Correct</span>
            </div>
            <div className="stat-tile stat-tile--incorrect">
              <span className="stat-tile__value">{stats.overall.incorrect}</span>
              <span className="stat-tile__label">Incorrect</span>
            </div>
            <div className="stat-tile">
              <span className="stat-tile__value">{stats.overall.accuracy}%</span>
              <span className="stat-tile__label">Overall Accuracy</span>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-state__emoji" aria-hidden="true">
              🚀
            </p>
            <p className="empty-state__title">No practice yet!</p>
            <p>Finish a practice session and your progress will show up here.</p>
            <Link to={ROUTES.practiceSetup} className="btn btn--primary">
              Start Practice
            </Link>
          </div>
        )}
      </section>

      {hasPracticed && (
        <>
          {/* ---------- Frequently Missed Areas ---------- */}
          <section className="stats-section" aria-labelledby="missed-title">
            <h2 id="missed-title" className="stats-section__title">
              Frequently Missed Areas
            </h2>
            {hasMistakes ? (
              <div className="missed-grid">
                <div className="panel">
                  <h3 className="panel__title">Most Missed Operation</h3>
                  <p className="missed-operation">
                    {stats.mostMissedOperations
                      .map((op) => `${OPERATION_SYMBOLS[op]} ${OPERATION_LABELS[op]}`)
                      .join(' and ')}
                    {stats.mostMissedOperations.length > 1 && (
                      <span className="missed-operation__tie"> (tied)</span>
                    )}
                  </p>
                </div>
                <div className="panel">
                  <h3 className="panel__title">Most Missed Number Facts</h3>
                  <ol className="missed-facts">
                    {stats.mostMissedFacts.map((fact) => (
                      <li key={fact.patternKey} className="missed-facts__item">
                        <span className="missed-facts__problem">{fact.displayText}</span>
                        <span className="missed-facts__count">
                          missed {fact.incorrectCount}{' '}
                          {fact.incorrectCount === 1 ? 'time' : 'times'}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            ) : (
              <p className="empty-note">No mistakes yet. Amazing! 🌟</p>
            )}
          </section>

          <MistakeDetails
            mistakes={mistakes}
            stats={stats.mistakes}
            masteryThreshold={settings.masteryThreshold}
            formatDate={formatDate}
          />

          {/* ---------- By Operation ---------- */}
          <section className="stats-section" aria-labelledby="by-operation-title">
            <h2 id="by-operation-title" className="stats-section__title">
              By Operation
            </h2>
            <div className="result-grid">
              {MATH_OPERATIONS.map((op) => (
                <ResultTotalsCard
                  key={op}
                  title={OPERATION_LABELS[op]}
                  icon={OPERATION_SYMBOLS[op]}
                  totals={stats.byOperation[op]}
                  className={`result-card--${op}`}
                />
              ))}
            </div>
          </section>

          {/* ---------- By Difficulty ---------- */}
          <section className="stats-section" aria-labelledby="by-difficulty-title">
            <h2 id="by-difficulty-title" className="stats-section__title">
              By Difficulty
            </h2>
            <div className="result-grid">
              {DIFFICULTY_LEVELS.map((level, index) => (
                <ResultTotalsCard
                  key={level}
                  title={`Level ${index + 1}: ${DIFFICULTY_LABELS[level]}`}
                  icon={'★'.repeat(index + 1)}
                  totals={stats.byDifficulty[level]}
                />
              ))}
            </div>
          </section>

          {/* ---------- Recent Sessions ---------- */}
          <section className="stats-section" aria-labelledby="recent-title">
            <h2 id="recent-title" className="stats-section__title">
              Recent Sessions
            </h2>
            {stats.recentSessions.length > 0 ? (
              <ul className="session-list">
                {stats.recentSessions.map((s) => (
                  <li key={s.sessionId} className="session-list__item">
                    <div className="session-list__when">
                      <strong>{formatDate(s.startedAt)}</strong>
                      <span>
                        {s.operations.map((op) => OPERATION_SYMBOLS[op]).join(' ')} ·{' '}
                        {DIFFICULTY_LABELS[s.difficulty]}
                        {s.mode === 'mistake-review' ? ' · Mistake review' : ''}
                      </span>
                    </div>
                    <dl className="session-list__stats">
                      <div>
                        <dt>Attempted</dt>
                        <dd>{s.attempted}</dd>
                      </div>
                      <div>
                        <dt>Correct</dt>
                        <dd>{s.correct}</dd>
                      </div>
                      <div>
                        <dt>Incorrect</dt>
                        <dd>{s.incorrect}</dd>
                      </div>
                      <div>
                        <dt>Accuracy</dt>
                        <dd>{s.accuracy}%</dd>
                      </div>
                    </dl>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="empty-note">No finished sessions yet.</p>
            )}
          </section>
        </>
      )}

      {/* ---------- Actions ---------- */}
      <div className="page__actions stats-actions">
        <Link to={ROUTES.practiceSetup} className="btn btn--primary">
          Practice Again
        </Link>
        <PracticeMistakesButton key={version} />
        <div className="action-with-reason">
          <button
            type="button"
            className="btn btn--danger"
            onClick={() => setConfirmResetOpen(true)}
            disabled={!hasPracticed}
            aria-describedby="reset-description"
          >
            Reset Statistics
          </button>
          <span id="reset-description" className="disabled-reason">
            Clears your history and statistics. Your settings stay the same.
          </span>
        </div>
        <Link to={ROUTES.home} className="btn btn--secondary">
          Back to Home
        </Link>
      </div>

      <ConfirmDialog
        open={confirmResetOpen}
        title="Reset your statistics?"
        message="This deletes all of your practice history, statistics and mistakes. Your settings will stay the same. This can't be undone."
        confirmLabel="Yes, Reset Statistics"
        cancelLabel="Keep My Statistics"
        tone="danger"
        onConfirm={confirmReset}
        onCancel={closeReset}
      />
    </PageContainer>
  )
}

export default StatisticsPage
