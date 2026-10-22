import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import DifficultySelector from '../components/DifficultySelector'
import OperationSelector from '../components/OperationSelector'
import PageContainer from '../components/PageContainer'
import SessionLengthSelector from '../components/SessionLengthSelector'
import ToggleSetting from '../components/ToggleSetting'
import { useSettingsControls } from '../hooks/useSettings'
import { ROUTES } from '../routes'
import { clearAllData } from '../services/practiceStore'
import type { AppSettings } from '../types'
import { MAX_MASTERY_THRESHOLD, MIN_MASTERY_THRESHOLD } from '../types'

function SettingsPage() {
  const navigate = useNavigate()
  const { settings, updateSettings, resetSettingsToDefaults } = useSettingsControls()
  const [savedMessage, setSavedMessage] = useState('')
  const [operationsWarning, setOperationsWarning] = useState(false)
  const [confirmClearOpen, setConfirmClearOpen] = useState(false)

  const change = (changes: Partial<AppSettings>) => {
    updateSettings(changes)
    setSavedMessage('Saved ✓')
  }

  const setThreshold = (value: number) => {
    if (!Number.isFinite(value)) return
    const clamped = Math.min(
      MAX_MASTERY_THRESHOLD,
      Math.max(MIN_MASTERY_THRESHOLD, Math.round(value)),
    )
    change({ masteryThreshold: clamped })
  }

  const closeClear = useCallback(() => setConfirmClearOpen(false), [])
  const confirmClear = () => {
    clearAllData()
    resetSettingsToDefaults()
    setConfirmClearOpen(false)
    navigate(ROUTES.home)
  }

  return (
    <PageContainer title="Settings" subtitle="Changes are saved automatically.">
      <p className="settings-saved" role="status">
        {savedMessage}
      </p>

      <section className="setup-group" aria-labelledby="general-title">
        <h2 id="general-title" className="setup-group__legend">
          Practice Options
        </h2>
        <div className="toggle-list">
          <ToggleSetting
            label="Sound effects"
            description="Play a short chime after each answer."
            checked={settings.soundEffects}
            onChange={(soundEffects) => change({ soundEffects })}
          />
          <ToggleSetting
            label="Card animation"
            description="Flip the card with an animation. Turn off for an instant switch."
            checked={settings.cardAnimation}
            onChange={(cardAnimation) => change({ cardAnimation })}
          />
          <ToggleSetting
            label="Show explanations"
            description="Explain each problem in words on the back of the card."
            checked={settings.showExplanations}
            onChange={(showExplanations) => change({ showExplanations })}
          />
          <ToggleSetting
            label="Encouraging feedback messages"
            description="Show friendly messages like “Great job!” between cards."
            checked={settings.encouragingFeedback}
            onChange={(encouragingFeedback) => change({ encouragingFeedback })}
          />
        </div>

        <div className="threshold">
          <div className="toggle-setting__text">
            <label htmlFor="mastery-threshold" className="toggle-setting__label">
              Mastery threshold
            </label>
            <span id="mastery-threshold-help" className="toggle-setting__description">
              Correct similar answers needed to master a mistake pattern ({MIN_MASTERY_THRESHOLD}–
              {MAX_MASTERY_THRESHOLD}).
            </span>
          </div>
          <div className="stepper">
            <button
              type="button"
              className="btn btn--secondary stepper__btn"
              aria-label="Decrease mastery threshold"
              onClick={() => setThreshold(settings.masteryThreshold - 1)}
              disabled={settings.masteryThreshold <= MIN_MASTERY_THRESHOLD}
            >
              −
            </button>
            <input
              id="mastery-threshold"
              className="stepper__input"
              type="number"
              inputMode="numeric"
              min={MIN_MASTERY_THRESHOLD}
              max={MAX_MASTERY_THRESHOLD}
              value={settings.masteryThreshold}
              aria-describedby="mastery-threshold-help"
              onChange={(event) => setThreshold(Number(event.target.value))}
            />
            <button
              type="button"
              className="btn btn--secondary stepper__btn"
              aria-label="Increase mastery threshold"
              onClick={() => setThreshold(settings.masteryThreshold + 1)}
              disabled={settings.masteryThreshold >= MAX_MASTERY_THRESHOLD}
            >
              +
            </button>
          </div>
        </div>
      </section>

      <section className="settings-defaults" aria-labelledby="defaults-title">
        <h2 id="defaults-title" className="stats-section__title">
          Practice Defaults
        </h2>
        <p className="setup-group__hint">
          These are picked automatically when you start a new practice. You can still change them
          each time.
        </p>
        {operationsWarning && (
          <p className="form-message form-message--warning" role="alert">
            Keep at least one operation selected.
          </p>
        )}
        <OperationSelector
          selected={settings.defaultOperations}
          onChange={(defaultOperations) => {
            if (defaultOperations.length === 0) {
              setOperationsWarning(true)
              return
            }
            setOperationsWarning(false)
            change({ defaultOperations })
          }}
        />
        <DifficultySelector
          selected={settings.defaultDifficulty}
          onChange={(defaultDifficulty) => change({ defaultDifficulty })}
        />
        <SessionLengthSelector
          selected={settings.defaultSessionLength}
          onChange={(defaultSessionLength) => change({ defaultSessionLength })}
        />
      </section>

      <section className="danger-zone" aria-labelledby="danger-title">
        <h2 id="danger-title" className="stats-section__title">
          Clear All Data
        </h2>
        <p>
          Deletes <strong>everything</strong> saved on this device: settings, practice history,
          statistics and mistakes. Your progress lives only in this browser, so clearing your
          browser data also removes it.
        </p>
        <button type="button" className="btn btn--danger" onClick={() => setConfirmClearOpen(true)}>
          Clear All Application Data
        </button>
      </section>

      <ConfirmDialog
        open={confirmClearOpen}
        title="⚠️ Delete everything?"
        message="This permanently deletes ALL of your settings, practice history, statistics and mistakes on this device. This cannot be undone."
        confirmLabel="Yes, Delete Everything"
        cancelLabel="No, Keep My Data"
        tone="danger"
        onConfirm={confirmClear}
        onCancel={closeClear}
      />
    </PageContainer>
  )
}

export default SettingsPage
