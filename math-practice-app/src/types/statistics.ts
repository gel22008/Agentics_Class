import type { DifficultyLevel, MathOperation } from './question'
import type { PracticeMode, SessionLength, SessionStatus } from './session'

/** Attempted / correct / incorrect totals with accuracy as a 0–100 percentage. */
export interface ResultTotals {
  attempted: number
  correct: number
  incorrect: number
  accuracy: number
}

export type OperationStatistics = Record<MathOperation, ResultTotals>

export type DifficultyStatistics = Record<DifficultyLevel, ResultTotals>

/** One row in the Recent Sessions list and the end-of-session summary. */
export interface SessionSummary extends ResultTotals {
  sessionId: string
  /** ISO timestamps. */
  startedAt: string
  completedAt?: string
  operations: MathOperation[]
  difficulty: DifficultyLevel
  sessionLength: SessionLength
  mode: PracticeMode
  reviewQuestionCount: number
  /** 'active' means the session was left without finishing (it is saved after every answer). */
  status?: SessionStatus
}

export interface MistakeStatistics {
  activeCount: number
  masteredCount: number
  similarQuestionsPracticed: number
  similarQuestionsCorrect: number
}

/** A frequently missed number fact for the Statistics page. */
export interface MissedFact {
  patternKey: string
  displayText: string
  operation: MathOperation
  incorrectCount: number
}

/** Everything the Statistics page displays. */
export interface AppStatistics {
  overall: ResultTotals
  byOperation: OperationStatistics
  byDifficulty: DifficultyStatistics
  recentSessions: SessionSummary[]
  mistakes: MistakeStatistics
  /** Every operation tied for the most mistakes (empty when there are none). */
  mostMissedOperations: MathOperation[]
  mostMissedFacts: MissedFact[]
}
