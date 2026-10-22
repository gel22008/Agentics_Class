import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../routes'
import { mistakeReviewAvailability } from '../services/mistakeReview'
import { createMistakeReviewConfig } from '../utils/session'

/** Starts a mistake-review session, or stays disabled with a short reason (checked automatically). */
function PracticeMistakesButton() {
  const navigate = useNavigate()
  const { available, reason, active } = mistakeReviewAvailability()

  return (
    <div className="action-with-reason">
      <button
        type="button"
        className="btn btn--secondary"
        disabled={!available}
        aria-describedby={available ? undefined : 'practice-mistakes-reason'}
        onClick={() =>
          navigate(ROUTES.practiceSession, {
            state: { config: createMistakeReviewConfig(active) },
          })
        }
      >
        Practice Mistakes{available ? ` (${active.length})` : ''}
      </button>
      {!available && (
        <span id="practice-mistakes-reason" className="disabled-reason">
          {reason}
        </span>
      )}
    </div>
  )
}

export default PracticeMistakesButton
