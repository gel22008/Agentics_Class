interface ProgressBarProps {
  completed: number
  /** null for continuous practice: shows a count instead of a bar. */
  total: number | null
}

function ProgressBar({ completed, total }: ProgressBarProps) {
  if (total === null) {
    return (
      <div className="progress">
        <p className="progress__label" aria-live="polite">
          {completed} {completed === 1 ? 'question' : 'questions'} answered
        </p>
      </div>
    )
  }

  const percent = Math.min(100, Math.round((completed / total) * 100))
  const label = `${completed} of ${total} completed`
  return (
    <div className="progress">
      <p className="progress__label" aria-live="polite">
        {label}
      </p>
      <div
        className="progress__track"
        role="progressbar"
        aria-label="Session progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completed}
        aria-valuetext={label}
      >
        <div className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}

export default ProgressBar
