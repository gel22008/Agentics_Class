interface AnswerChoiceProps {
  value: number
  /** 1-based position, also the keyboard shortcut. */
  position: number
  isSelected: boolean
  isLocked: boolean
  onSelect: (value: number) => void
}

/** One multiple-choice answer, shown as a large button. */
function AnswerChoice({ value, position, isSelected, isLocked, onSelect }: AnswerChoiceProps) {
  return (
    <button
      type="button"
      className={`answer-choice${isSelected ? ' answer-choice--selected' : ''}`}
      aria-pressed={isSelected}
      aria-label={`Answer ${position}: ${value}${isSelected ? ', selected' : ''}`}
      aria-keyshortcuts={String(position)}
      disabled={isLocked}
      onClick={() => onSelect(value)}
    >
      <span className="answer-choice__key" aria-hidden="true">
        {position}
      </span>
      <span className="answer-choice__value">{value}</span>
      {isSelected && (
        <span className="answer-choice__mark" aria-hidden="true">
          ✓
        </span>
      )}
    </button>
  )
}

export default AnswerChoice
