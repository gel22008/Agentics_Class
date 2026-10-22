import type { DifficultyLevel, MathOperation } from './question'

export type MistakeStatus = 'active' | 'mastered'

/** A math fact the child has gotten wrong, tracked until it is mastered. */
export interface MistakePattern {
  id: string
  /** Same key as Question.patternKey, e.g. "multiplication:8:7". Prevents duplicates. */
  patternKey: string
  operation: MathOperation
  operandA: number
  operandB: number
  correctAnswer: number
  difficulty: DifficultyLevel
  incorrectCount: number
  /** Correct answers on similar review questions since the last mistake. */
  similarCorrectCount: number
  /** Total similar review questions answered for this pattern. */
  similarPracticedCount: number
  status: MistakeStatus
  /** ISO timestamps. */
  firstIncorrectAt: string
  lastIncorrectAt: string
  masteredAt?: string
}
