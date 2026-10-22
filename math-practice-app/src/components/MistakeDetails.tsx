import { useState } from 'react'
import { formatQuestionText } from '../services/questionGenerator'
import type { MistakePattern, MistakeStatistics } from '../types'

interface MistakeDetailsProps {
  mistakes: readonly MistakePattern[]
  stats: MistakeStatistics
  masteryThreshold: number
  formatDate: (iso: string) => string
}

/** Active and mastered mistake patterns with miss counts and mastery progress. */
function MistakeDetails({ mistakes, stats, masteryThreshold, formatDate }: MistakeDetailsProps) {
  const [tab, setTab] = useState<'active' | 'mastered'>('active')
  const shown = mistakes
    .filter((m) => m.status === tab)
    .sort(
      (a, b) =>
        b.incorrectCount - a.incorrectCount || b.lastIncorrectAt.localeCompare(a.lastIncorrectAt),
    )

  return (
    <section className="stats-section" aria-labelledby="mistake-details-title">
      <h2 id="mistake-details-title" className="stats-section__title">
        Mistake Details
      </h2>
      <div className="summary-grid">
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.activeCount}</span>
          <span className="stat-tile__label">Active</span>
        </div>
        <div className="stat-tile stat-tile--correct">
          <span className="stat-tile__value">{stats.masteredCount}</span>
          <span className="stat-tile__label">Mastered</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.similarQuestionsPracticed}</span>
          <span className="stat-tile__label">Similar Questions Practiced</span>
        </div>
        <div className="stat-tile">
          <span className="stat-tile__value">{stats.similarQuestionsCorrect}</span>
          <span className="stat-tile__label">Review Answers Correct</span>
        </div>
      </div>

      <div className="tabs" role="group" aria-label="Show mistakes">
        <button
          type="button"
          className={`tabs__btn${tab === 'active' ? ' tabs__btn--active' : ''}`}
          aria-pressed={tab === 'active'}
          onClick={() => setTab('active')}
        >
          Active ({stats.activeCount})
        </button>
        <button
          type="button"
          className={`tabs__btn${tab === 'mastered' ? ' tabs__btn--active' : ''}`}
          aria-pressed={tab === 'mastered'}
          onClick={() => setTab('mastered')}
        >
          Mastered ({stats.masteredCount})
        </button>
      </div>

      {shown.length === 0 ? (
        <p className="empty-note">
          {tab === 'active'
            ? 'No active mistakes. Great work! 🌟'
            : `Nothing mastered yet. Get ${masteryThreshold} similar questions right to master a fact.`}
        </p>
      ) : (
        <ul className="mistake-list">
          {shown.map((m) => {
            const progress = Math.min(m.similarCorrectCount, masteryThreshold)
            return (
              <li key={m.id} className="mistake-list__item">
                <span className="mistake-list__problem">
                  {formatQuestionText(m.operation, m.operandA, m.operandB)} = {m.correctAnswer}
                </span>
                <span className="mistake-list__meta">
                  Missed {m.incorrectCount} {m.incorrectCount === 1 ? 'time' : 'times'} · last{' '}
                  {formatDate(m.lastIncorrectAt)}
                </span>
                <span className="mistake-list__progress">
                  {m.status === 'mastered' ? (
                    <strong>Mastered ✓</strong>
                  ) : (
                    <>
                      <span
                        className="mastery-dots"
                        role="img"
                        aria-label={`${progress} of ${masteryThreshold} correct reviews`}
                      >
                        {Array.from({ length: masteryThreshold }, (_, i) => (
                          <span
                            key={i}
                            className={
                              i < progress ? 'mastery-dot mastery-dot--done' : 'mastery-dot'
                            }
                          />
                        ))}
                      </span>
                      <span aria-hidden="true">
                        {progress}/{masteryThreshold} reviews
                      </span>
                    </>
                  )}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

export default MistakeDetails
