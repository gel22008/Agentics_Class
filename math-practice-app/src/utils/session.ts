import type {
  PracticeAttempt,
  PracticeConfig,
  PracticeSession,
  Question,
  SessionSummary,
} from '../types'
import { DIFFICULTY_LEVELS, MATH_OPERATIONS, SESSION_LENGTHS } from '../types'
import { createId } from './random'
import { calculateAccuracy } from './stats'

/** Checks data passed between pages (or loaded later from storage) before trusting it. */
export function isValidPracticeConfig(value: unknown): value is PracticeConfig {
  if (typeof value !== 'object' || value === null) return false
  const config = value as Record<string, unknown>
  return (
    Array.isArray(config.operations) &&
    config.operations.length > 0 &&
    config.operations.every((op) => MATH_OPERATIONS.includes(op)) &&
    DIFFICULTY_LEVELS.includes(config.difficulty as never) &&
    SESSION_LENGTHS.includes(config.sessionLength as never) &&
    (config.mode === 'regular' || config.mode === 'mistake-review')
  )
}

export function createSession(config: PracticeConfig, now = new Date()): PracticeSession {
  return {
    id: createId('session'),
    config,
    status: 'active',
    startedAt: now.toISOString(),
    currentQuestionIndex: 0,
    attemptedCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    reviewQuestionCount: 0,
  }
}

/** True once a fixed-length session has had all of its questions answered. */
export function isSessionComplete(session: PracticeSession): boolean {
  const { sessionLength } = session.config
  return sessionLength !== 'continuous' && session.attemptedCount >= sessionLength
}

export function summarizeSession(session: PracticeSession): SessionSummary {
  return {
    sessionId: session.id,
    startedAt: session.startedAt,
    completedAt: session.completedAt,
    operations: session.config.operations,
    difficulty: session.config.difficulty,
    sessionLength: session.config.sessionLength,
    mode: session.config.mode,
    reviewQuestionCount: session.reviewQuestionCount,
    attempted: session.attemptedCount,
    correct: session.correctCount,
    incorrect: session.incorrectCount,
    accuracy: calculateAccuracy(session.correctCount, session.attemptedCount),
  }
}

/** Builds the record of one answered question. */
export function buildAttempt(
  session: PracticeSession,
  question: Question,
  selectedAnswer: number,
  selfReportedCorrect: boolean,
  now = new Date(),
): PracticeAttempt {
  return {
    id: createId('attempt'),
    sessionId: session.id,
    questionId: question.id,
    operation: question.operation,
    difficulty: question.difficulty,
    operandA: question.operandA,
    operandB: question.operandB,
    correctAnswer: question.correctAnswer,
    selectedAnswer,
    selfReportedCorrect,
    selectedAnswerWasCorrect: selectedAnswer === question.correctAnswer,
    patternKey: question.patternKey,
    source: question.source,
    ...(question.mistakePatternId ? { mistakePatternId: question.mistakePatternId } : {}),
    attemptedAt: now.toISOString(),
  }
}

/** Applies one self-reported result to the session totals. */
export function recordResult(
  session: PracticeSession,
  question: Question,
  selfReportedCorrect: boolean,
): PracticeSession {
  return {
    ...session,
    currentQuestionIndex: session.currentQuestionIndex + 1,
    attemptedCount: session.attemptedCount + 1,
    correctCount: session.correctCount + (selfReportedCorrect ? 1 : 0),
    incorrectCount: session.incorrectCount + (selfReportedCorrect ? 0 : 1),
    reviewQuestionCount:
      session.reviewQuestionCount + (question.source === 'mistake-review' ? 1 : 0),
  }
}

export function finishSession(
  session: PracticeSession,
  status: 'completed' | 'ended-early',
  now = new Date(),
): PracticeSession {
  return { ...session, status, completedAt: now.toISOString() }
}
