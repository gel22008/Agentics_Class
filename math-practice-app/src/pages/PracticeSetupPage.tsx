import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DifficultySelector from '../components/DifficultySelector'
import OperationSelector from '../components/OperationSelector'
import PageContainer from '../components/PageContainer'
import SessionLengthSelector from '../components/SessionLengthSelector'
import { ROUTES } from '../routes'
import type {
  DifficultyLevel,
  MathOperation,
  PracticeConfig,
  PracticeMode,
  SessionLength,
} from '../types'
import { useSettings } from '../hooks/useSettings'
import { mistakeReviewAvailability } from '../services/mistakeReview'
import { createMistakeReviewConfig } from '../utils/session'

function PracticeSetupPage() {
  const navigate = useNavigate()
  const settings = useSettings()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [operations, setOperations] = useState<MathOperation[]>(settings.defaultOperations)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(settings.defaultDifficulty)
  const [sessionLength, setSessionLength] = useState<SessionLength>(settings.defaultSessionLength)

  const [mode, setMode] = useState<PracticeMode>('regular')
  const [review] = useState(mistakeReviewAvailability)
  const isReview = mode === 'mistake-review'
  const canStart = isReview ? review.available : operations.length > 0

  const startSession = () => {
    if (!canStart) return
    const config: PracticeConfig = isReview
      ? createMistakeReviewConfig(review.active, sessionLength)
      : { operations, difficulty, sessionLength, mode: 'regular' }
    navigate(ROUTES.practiceSession, { state: { config } })
  }

  return (
    <PageContainer title="Practice Setup" subtitle="Choose what you want to practice today.">
      {notice && (
        <p className="form-message form-message--warning" role="status">
          {notice}
        </p>
      )}
      <form
        className="setup-form"
        onSubmit={(event) => {
          event.preventDefault()
          startSession()
        }}
      >
        <fieldset className="setup-group">
          <legend className="setup-group__legend">Practice Type</legend>
          <div className="choice-grid choice-grid--two">
            <label className={`choice-card${!isReview ? ' choice-card--selected' : ''}`}>
              <input
                type="radio"
                name="practice-mode"
                className="visually-hidden"
                checked={!isReview}
                onChange={() => setMode('regular')}
              />
              <span className="choice-card__check" aria-hidden="true">
                {!isReview ? '✓' : ''}
              </span>
              <span className="choice-card__big" aria-hidden="true">
                ✏️
              </span>
              <span className="choice-card__label">Regular Practice</span>
              <span className="choice-card__description">New questions you choose below</span>
            </label>
            <label
              className={`choice-card${isReview ? ' choice-card--selected' : ''}${
                !review.available ? ' choice-card--disabled' : ''
              }`}
            >
              <input
                type="radio"
                name="practice-mode"
                className="visually-hidden"
                checked={isReview}
                disabled={!review.available}
                aria-describedby="review-mode-detail"
                onChange={() => setMode('mistake-review')}
              />
              <span className="choice-card__check" aria-hidden="true">
                {isReview ? '✓' : ''}
              </span>
              <span className="choice-card__big" aria-hidden="true">
                🔁
              </span>
              <span className="choice-card__label">Mistake Review</span>
              <span id="review-mode-detail" className="choice-card__description">
                {review.available
                  ? `${review.active.length} ${
                      review.active.length === 1 ? 'fact' : 'facts'
                    } to practice with similar questions`
                  : review.reason}
              </span>
            </label>
          </div>
        </fieldset>

        {isReview ? (
          <p className="setup-group setup-group__hint">
            Review questions are made from the facts you missed, at the same level you practiced
            them.
          </p>
        ) : (
          <>
            <OperationSelector selected={operations} onChange={setOperations} />
            <DifficultySelector selected={difficulty} onChange={setDifficulty} />
          </>
        )}
        <SessionLengthSelector selected={sessionLength} onChange={setSessionLength} />

        <div className="setup-form__footer">
          {!canStart && (
            <p className="form-message form-message--warning" role="alert">
              <span aria-hidden="true">⚠️ </span>
              Pick at least one operation to start.
            </p>
          )}
          <button type="submit" className="btn btn--primary btn--large" disabled={!canStart}>
            Start Session
          </button>
        </div>
      </form>
    </PageContainer>
  )
}

export default PracticeSetupPage
