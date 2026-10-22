import type { DifficultyLevel, MathOperation } from './question'
import type { SessionLength } from './session'

export interface AppSettings {
  soundEffects: boolean
  cardAnimation: boolean
  showExplanations: boolean
  encouragingFeedback: boolean
  /** Correct similar answers needed to master a mistake pattern. */
  masteryThreshold: number
  defaultOperations: MathOperation[]
  defaultDifficulty: DifficultyLevel
  defaultSessionLength: SessionLength
}

export const MIN_MASTERY_THRESHOLD = 1
export const MAX_MASTERY_THRESHOLD = 10

export const DEFAULT_SETTINGS: AppSettings = {
  soundEffects: true,
  cardAnimation: true,
  showExplanations: true,
  encouragingFeedback: true,
  masteryThreshold: 3,
  defaultOperations: ['addition'],
  defaultDifficulty: 'beginner',
  defaultSessionLength: 10,
}
