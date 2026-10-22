import type { DifficultyLevel, MathOperation, QuestionSource } from './question'

/** Number of questions in a session, or open-ended practice. */
export type SessionLength = 5 | 10 | 20 | 'continuous'

export const SESSION_LENGTHS: readonly SessionLength[] = [5, 10, 20, 'continuous']

export type PracticeMode = 'regular' | 'mistake-review'

/** What the child chose on the Practice Setup page. */
export interface PracticeConfig {
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  mode: PracticeMode
}

export type SessionStatus = 'active' | 'completed' | 'ended-early'

/** One practice session from start to finish. */
export interface PracticeSession {
  id: string
  config: PracticeConfig
  status: SessionStatus
  /** ISO timestamp. */
  startedAt: string
  /** ISO timestamp, set when the session ends. */
  completedAt?: string
  currentQuestionIndex: number
  attemptedCount: number
  correctCount: number
  incorrectCount: number
  /** How many questions in this session were mistake-review questions. */
  reviewQuestionCount: number
}

/** One answered question. */
export interface PracticeAttempt {
  id: string
  sessionId: string
  questionId: string
  operation: MathOperation
  difficulty: DifficultyLevel
  operandA: number
  operandB: number
  correctAnswer: number
  selectedAnswer: number
  /** What the child reported with "I Got It Right" / "I Got It Wrong". This drives statistics. */
  selfReportedCorrect: boolean
  /** Whether the selected answer actually matched, used for the gentle "recheck" nudge. */
  selectedAnswerWasCorrect: boolean
  patternKey: string
  source: QuestionSource
  mistakePatternId?: string
  /** ISO timestamp. */
  attemptedAt: string
}
