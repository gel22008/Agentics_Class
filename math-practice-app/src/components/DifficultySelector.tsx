import type { DifficultyLevel } from '../types'
import { DIFFICULTY_LABELS, DIFFICULTY_LEVELS } from '../types'
import { DIFFICULTY_RULES } from '../utils/difficulty'

interface DifficultySelectorProps {
  selected: DifficultyLevel
  onChange: (level: DifficultyLevel) => void
}

/** Pick exactly one difficulty level (radio buttons: arrow keys move between options). */
function DifficultySelector({ selected, onChange }: DifficultySelectorProps) {
  return (
    <fieldset className="setup-group">
      <legend className="setup-group__legend">Difficulty</legend>
      <div className="choice-grid choice-grid--four">
        {DIFFICULTY_LEVELS.map((level, index) => {
          const isSelected = level === selected
          return (
            <label
              key={level}
              className={`choice-card choice-card--level${isSelected ? ' choice-card--selected' : ''}`}
            >
              <input
                type="radio"
                name="difficulty"
                className="visually-hidden"
                value={level}
                checked={isSelected}
                onChange={() => onChange(level)}
              />
              <span className="choice-card__check" aria-hidden="true">
                {isSelected ? '✓' : ''}
              </span>
              <span className="choice-card__stars" aria-hidden="true">
                {'★'.repeat(index + 1)}
              </span>
              <span className="choice-card__label">{DIFFICULTY_LABELS[level]}</span>
              <span className="choice-card__description">
                {DIFFICULTY_RULES[level].description}
              </span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}

export default DifficultySelector
