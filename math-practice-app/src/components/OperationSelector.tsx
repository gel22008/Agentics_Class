import type { MathOperation } from '../types'
import { MATH_OPERATIONS, OPERATION_LABELS, OPERATION_SYMBOLS } from '../types'

interface OperationSelectorProps {
  selected: MathOperation[]
  onChange: (operations: MathOperation[]) => void
}

/** Pick one or more operations. Uses real checkboxes so it works with keyboard and screen readers. */
function OperationSelector({ selected, onChange }: OperationSelectorProps) {
  const allSelected = MATH_OPERATIONS.every((op) => selected.includes(op))

  const toggle = (operation: MathOperation) => {
    const next = selected.includes(operation)
      ? selected.filter((op) => op !== operation)
      : [...selected, operation]
    // Keep a consistent order regardless of click order.
    onChange(MATH_OPERATIONS.filter((op) => next.includes(op)))
  }

  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">Operations</legend>
      <p className="setup-group__hint">Pick one or more. Choose all four for mixed practice!</p>

      <button
        type="button"
        className="btn btn--secondary btn--small"
        onClick={() => onChange(allSelected ? [] : [...MATH_OPERATIONS])}
        aria-pressed={allSelected}
      >
        {allSelected ? 'Clear All Operations' : 'Select All Operations'}
      </button>

      <div className="choice-grid choice-grid--four">
        {MATH_OPERATIONS.map((operation) => {
          const isSelected = selected.includes(operation)
          return (
            <label
              key={operation}
              className={`choice-card choice-card--${operation}${isSelected ? ' choice-card--selected' : ''}`}
            >
              <input
                type="checkbox"
                className="visually-hidden"
                checked={isSelected}
                onChange={() => toggle(operation)}
              />
              <span className="choice-card__check" aria-hidden="true">
                {isSelected ? '✓' : ''}
              </span>
              <span className="choice-card__symbol" aria-hidden="true">
                {OPERATION_SYMBOLS[operation]}
              </span>
              <span className="choice-card__label">{OPERATION_LABELS[operation]}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default OperationSelector
