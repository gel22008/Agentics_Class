import type { SessionLength } from '../types'
import { SESSION_LENGTHS } from '../types'
import { sessionLengthLabel } from '../utils/format'

interface SessionLengthSelectorProps {
  selected: SessionLength
  onChange: (length: SessionLength) => void
}

function SessionLengthSelector({ selected, onChange }: SessionLengthSelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">How many questions?</legend>
      <div className="choice-grid choice-grid--four">
        {SESSION_LENGTHS.map((length) => {
          const isSelected = length === selected
          return (
            <label
              key={String(length)}
              className={`choice-card choice-card--compact${isSelected ? ' choice-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="session-length"
                className="visually-hidden"
                value={String(length)}
                checked={isSelected}
                onChange={() => onChange(length)}
              />
              <span className="choice-card__check" aria-hidden="true">
                {isSelected ? '✓' : ''}
              </span>
              <span className="choice-card__big">{length === 'continuous' ? '∞' : length}</span>
              <span className="choice-card__label">{sessionLengthLabel(length)}</span>
              {length === 'continuous' && (
                <span className="choice-card__description">Stop whenever you want</span>
              )}
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default SessionLengthSelector
