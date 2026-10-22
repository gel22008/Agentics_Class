import { DEFAULT_SETTINGS } from '../types'
import { buildQuestion } from './questionGenerator'
import {
  buildAttempt,
  createSession,
  finishSession,
  recordResult,
  summarizeSession,
} from '../utils/session'
import {
  clearAllData,
  clearStatistics,
  loadAttempts,
  loadSessions,
  loadSettings,
  saveAttempt,
  saveSession,
  saveSettings,
} from './practiceStore'

const config = {
  operations: ['addition' as const],
  difficulty: 'easy' as const,
  sessionLength: 5 as const,
  mode: 'regular' as const,
}

function finishedSummary(startedAt: string) {
  const question = buildQuestion('addition', 'easy', 2, 2)
  const session = recordResult({ ...createSession(config), startedAt }, question, true)
  return summarizeSession(finishSession(session, 'completed'))
}

describe('practiceStore', () => {
  it('uses default settings when none are saved, and remembers saved settings', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
    saveSettings({ ...DEFAULT_SETTINGS, showExplanations: false })
    expect(loadSettings().showExplanations).toBe(false)
  })

  it('recovers from invalid stored settings', () => {
    localStorage.setItem('mathPractice.settings', JSON.stringify({ masteryThreshold: 999 }))
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })

  it('saves attempts with all required details and never duplicates them', () => {
    const question = buildQuestion('multiplication', 'easy', 3, 4)
    const attempt = buildAttempt(createSession(config), question, 12, true)
    saveAttempt(attempt)
    saveAttempt(attempt)
    const stored = loadAttempts()
    expect(stored).toHaveLength(1)
    expect(stored[0]).toMatchObject({
      selectedAnswer: 12,
      selfReportedCorrect: true,
      operation: 'multiplication',
      difficulty: 'easy',
      sessionId: attempt.sessionId,
    })
    expect(stored[0].attemptedAt).toBe(attempt.attemptedAt)
  })

  it('loads recent sessions newest first', () => {
    saveSession(finishedSummary('2026-10-20T10:00:00.000Z'))
    saveSession(finishedSummary('2026-10-21T10:00:00.000Z'))
    const sessions = loadSessions()
    expect(sessions).toHaveLength(2)
    expect(sessions[0].startedAt).toBe('2026-10-21T10:00:00.000Z')
  })

  it('Reset Statistics keeps settings; Clear All Data removes everything', () => {
    saveSettings({ ...DEFAULT_SETTINGS, masteryThreshold: 4 })
    saveSession(finishedSummary('2026-10-21T10:00:00.000Z'))
    clearStatistics()
    expect(loadSessions()).toEqual([])
    expect(loadSettings().masteryThreshold).toBe(4)

    clearAllData()
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS)
  })
})
