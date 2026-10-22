import { buildQuestion } from '../services/questionGenerator'
import type { PracticeConfig } from '../types'
import {
  buildAttempt,
  createSession,
  finishSession,
  isSessionComplete,
  isValidPracticeConfig,
  recordResult,
  summarizeSession,
} from './session'
import { calculateAccuracy } from './stats'
import { pickFeedback, POSITIVE_MESSAGES, SUPPORTIVE_MESSAGES } from './feedback'

const config: PracticeConfig = {
  operations: ['addition'],
  difficulty: 'easy',
  sessionLength: 5,
  mode: 'regular',
}
const question = buildQuestion('addition', 'easy', 6, 3)

describe('session helpers', () => {
  it('validates practice configs', () => {
    expect(isValidPracticeConfig(config)).toBe(true)
    expect(isValidPracticeConfig(null)).toBe(false)
    expect(isValidPracticeConfig({ ...config, operations: [] })).toBe(false)
    expect(isValidPracticeConfig({ ...config, operations: ['modulo'] })).toBe(false)
    expect(isValidPracticeConfig({ ...config, sessionLength: 7 })).toBe(false)
    expect(isValidPracticeConfig({ ...config, difficulty: 'hard' })).toBe(false)
  })

  it('updates totals for each self-reported result', () => {
    let session = createSession(config)
    session = recordResult(session, question, true)
    session = recordResult(session, question, false)
    expect(session.attemptedCount).toBe(2)
    expect(session.correctCount).toBe(1)
    expect(session.incorrectCount).toBe(1)
    expect(session.currentQuestionIndex).toBe(2)
  })

  it('completes fixed-length sessions but never continuous ones', () => {
    let session = createSession(config)
    for (let i = 0; i < 4; i++) session = recordResult(session, question, true)
    expect(isSessionComplete(session)).toBe(false)
    session = recordResult(session, question, true)
    expect(isSessionComplete(session)).toBe(true)

    let continuous = createSession({ ...config, sessionLength: 'continuous' })
    for (let i = 0; i < 50; i++) continuous = recordResult(continuous, question, true)
    expect(isSessionComplete(continuous)).toBe(false)
  })

  it('saves the completion time and summarizes accuracy', () => {
    let session = createSession(config)
    session = recordResult(session, question, true)
    session = recordResult(session, question, true)
    session = recordResult(session, question, false)
    const finished = finishSession(session, 'completed', new Date('2026-10-21T20:00:00Z'))
    expect(finished.completedAt).toBe('2026-10-21T20:00:00.000Z')
    expect(summarizeSession(finished)).toMatchObject({ attempted: 3, correct: 2, accuracy: 67 })
  })

  it('builds attempt records with both the reported and the actual result', () => {
    const session = createSession(config)
    const attempt = buildAttempt(session, question, 8, true)
    expect(attempt).toMatchObject({
      sessionId: session.id,
      selectedAnswer: 8,
      correctAnswer: 9,
      selfReportedCorrect: true,
      selectedAnswerWasCorrect: false,
      operation: 'addition',
      difficulty: 'easy',
      patternKey: 'addition:6:3',
    })
    expect(Date.parse(attempt.attemptedAt)).not.toBeNaN()
  })
})

describe('calculateAccuracy', () => {
  it('handles zero attempts without dividing by zero', () => {
    expect(calculateAccuracy(0, 0)).toBe(0)
  })

  it('rounds to a whole percentage', () => {
    expect(calculateAccuracy(1, 3)).toBe(33)
    expect(calculateAccuracy(2, 3)).toBe(67)
    expect(calculateAccuracy(5, 5)).toBe(100)
  })
})

describe('pickFeedback', () => {
  it('uses positive messages for right answers and supportive ones for mistakes', () => {
    expect(POSITIVE_MESSAGES).toContain(pickFeedback(true))
    expect(SUPPORTIVE_MESSAGES).toContain(pickFeedback(false))
  })

  it('does not repeat the previous message', () => {
    for (let i = 0; i < 50; i++) {
      const first = pickFeedback(true)
      expect(pickFeedback(true, first)).not.toBe(first)
    }
  })
})
