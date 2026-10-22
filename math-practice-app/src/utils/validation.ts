import type { AppSettings, PracticeAttempt, SessionSummary } from '../types'
import {
  DIFFICULTY_LEVELS,
  MATH_OPERATIONS,
  MAX_MASTERY_THRESHOLD,
  MIN_MASTERY_THRESHOLD,
  SESSION_LENGTHS,
} from '../types'

type Obj = Record<string, unknown>

const isObject = (value: unknown): value is Obj => typeof value === 'object' && value !== null
const isNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value)
const isString = (value: unknown): value is string => typeof value === 'string'
const isOperation = (value: unknown) => MATH_OPERATIONS.includes(value as never)
const isDifficulty = (value: unknown) => DIFFICULTY_LEVELS.includes(value as never)

export function isPracticeAttempt(value: unknown): value is PracticeAttempt {
  if (!isObject(value)) return false
  return (
    isString(value.id) &&
    isString(value.sessionId) &&
    isOperation(value.operation) &&
    isDifficulty(value.difficulty) &&
    isNumber(value.operandA) &&
    isNumber(value.operandB) &&
    isNumber(value.correctAnswer) &&
    isNumber(value.selectedAnswer) &&
    typeof value.selfReportedCorrect === 'boolean' &&
    isString(value.patternKey) &&
    isString(value.attemptedAt)
  )
}

export function isSessionSummary(value: unknown): value is SessionSummary {
  if (!isObject(value)) return false
  return (
    isString(value.sessionId) &&
    isString(value.startedAt) &&
    Array.isArray(value.operations) &&
    value.operations.every(isOperation) &&
    isDifficulty(value.difficulty) &&
    SESSION_LENGTHS.includes(value.sessionLength as never) &&
    isNumber(value.attempted) &&
    isNumber(value.correct) &&
    isNumber(value.incorrect) &&
    isNumber(value.accuracy)
  )
}

export function isAppSettings(value: unknown): value is AppSettings {
  if (!isObject(value)) return false
  return (
    typeof value.soundEffects === 'boolean' &&
    typeof value.cardAnimation === 'boolean' &&
    typeof value.showExplanations === 'boolean' &&
    typeof value.encouragingFeedback === 'boolean' &&
    isNumber(value.masteryThreshold) &&
    value.masteryThreshold >= MIN_MASTERY_THRESHOLD &&
    value.masteryThreshold <= MAX_MASTERY_THRESHOLD &&
    Array.isArray(value.defaultOperations) &&
    value.defaultOperations.length > 0 &&
    value.defaultOperations.every(isOperation) &&
    isDifficulty(value.defaultDifficulty) &&
    SESSION_LENGTHS.includes(value.defaultSessionLength as never)
  )
}

/** Array validator built from an item validator. Drops nothing: one bad item fails the list. */
export const isArrayOf =
  <T>(isItem: (value: unknown) => value is T) =>
  (value: unknown): value is T[] =>
    Array.isArray(value) && value.every(isItem)
