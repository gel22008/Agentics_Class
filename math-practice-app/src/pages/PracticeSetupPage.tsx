import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import DifficultySelector from '../components/DifficultySelector'
import OperationSelector from '../components/OperationSelector'
import PageContainer from '../components/PageContainer'
import SessionLengthSelector from '../components/SessionLengthSelector'
import { ROUTES } from '../routes'
import type { DifficultyLevel, MathOperation, PracticeConfig, SessionLength } from '../types'
import { useSettings } from '../hooks/useSettings'

function PracticeSetupPage() {
  const navigate = useNavigate()
  const settings = useSettings()
  const notice = (useLocation().state as { notice?: string } | null)?.notice
  const [operations, setOperations] = useState<MathOperation[]>(settings.defaultOperations)
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(settings.defaultDifficulty)
  const [sessionLength, setSessionLength] = useState<SessionLength>(settings.defaultSessionLength)

  const canStart = operations.length > 0

  const startSession = () => {
    if (!canStart) return
    const config: PracticeConfig = { operations, difficulty, sessionLength, mode: 'regular' }
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
        <OperationSelector selected={operations} onChange={setOperations} />
        <DifficultySelector selected={difficulty} onChange={setDifficulty} />
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
