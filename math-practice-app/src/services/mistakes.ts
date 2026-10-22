import type { MistakePattern, PracticeAttempt } from '../types'
import { createId } from '../utils/random'

/** Records a wrong answer: creates the pattern, or updates it if this fact was missed before. */
export function recordMistake(
  patterns: readonly MistakePattern[],
  attempt: PracticeAttempt,
): MistakePattern[] {
  const existing = patterns.find((p) => p.patternKey === attempt.patternKey)
  if (existing) {
    return patterns.map((p) =>
      p.id === existing.id
        ? {
            ...p,
            incorrectCount: p.incorrectCount + 1,
            lastIncorrectAt: attempt.attemptedAt,
            // Missing it again resets mastery progress, and a mastered fact becomes active again.
            similarCorrectCount: 0,
            status: 'active' as const,
            masteredAt: undefined,
          }
        : p,
    )
  }
  const created: MistakePattern = {
    id: createId('mistake'),
    patternKey: attempt.patternKey,
    operation: attempt.operation,
    operandA: attempt.operandA,
    operandB: attempt.operandB,
    correctAnswer: attempt.correctAnswer,
    difficulty: attempt.difficulty,
    incorrectCount: 1,
    similarCorrectCount: 0,
    similarPracticedCount: 0,
    status: 'active',
    firstIncorrectAt: attempt.attemptedAt,
    lastIncorrectAt: attempt.attemptedAt,
  }
  return [...patterns, created]
}

/** Records an answer to a similar (review) question for a pattern. */
export function recordReviewResult(
  patterns: readonly MistakePattern[],
  patternId: string,
  correct: boolean,
  masteryThreshold: number,
  attemptedAt: string,
): MistakePattern[] {
  return patterns.map((p) => {
    if (p.id !== patternId) return p
    const practiced = { ...p, similarPracticedCount: p.similarPracticedCount + 1 }
    if (!correct) {
      return {
        ...practiced,
        incorrectCount: p.incorrectCount + 1,
        lastIncorrectAt: attemptedAt,
        similarCorrectCount: 0,
        status: 'active' as const,
        masteredAt: undefined,
      }
    }
    const similarCorrectCount = p.similarCorrectCount + 1
    const mastered = similarCorrectCount >= masteryThreshold
    return {
      ...practiced,
      similarCorrectCount,
      status: mastered ? ('mastered' as const) : p.status,
      masteredAt: mastered ? (p.masteredAt ?? attemptedAt) : p.masteredAt,
    }
  })
}

/** Updates mistake patterns after any answered question. */
export function applyAttemptToMistakes(
  patterns: readonly MistakePattern[],
  attempt: PracticeAttempt,
  masteryThreshold: number,
): MistakePattern[] {
  if (attempt.source === 'mistake-review' && attempt.mistakePatternId) {
    return recordReviewResult(
      patterns,
      attempt.mistakePatternId,
      attempt.selfReportedCorrect,
      masteryThreshold,
      attempt.attemptedAt,
    )
  }
  return attempt.selfReportedCorrect ? [...patterns] : recordMistake(patterns, attempt)
}

export const activePatterns = (patterns: readonly MistakePattern[]) =>
  patterns.filter((p) => p.status === 'active')

export const masteredPatterns = (patterns: readonly MistakePattern[]) =>
  patterns.filter((p) => p.status === 'mastered')

const DAY_MS = 24 * 60 * 60 * 1000

/**
 * Review priority: higher for facts missed often, missed recently, and with little successful
 * review. A small random part mixes up patterns with similar priority.
 */
export function mistakePriority(
  pattern: MistakePattern,
  masteryThreshold: number,
  now = Date.now(),
  random: () => number = Math.random,
): number {
  const daysSinceMiss = Math.max(0, (now - Date.parse(pattern.lastIncorrectAt)) / DAY_MS)
  const frequency = pattern.incorrectCount * 3
  const recency = Math.max(0, 7 - daysSinceMiss)
  const reviewNeeded = Math.max(0, masteryThreshold - pattern.similarCorrectCount) * 2
  return frequency + recency + reviewNeeded + random()
}

/**
 * Picks the next pattern to review. Higher-priority patterns are picked more often (weighted),
 * and the same pattern is not picked twice in a row when there is a choice.
 */
export function pickPatternForReview(
  patterns: readonly MistakePattern[],
  masteryThreshold: number,
  {
    avoidId,
    random = Math.random,
    now = Date.now(),
  }: { avoidId?: string; random?: () => number; now?: number } = {},
): MistakePattern | null {
  const pool = patterns.length > 1 ? patterns.filter((p) => p.id !== avoidId) : [...patterns]
  if (pool.length === 0) return null
  const weights = pool.map((p) => mistakePriority(p, masteryThreshold, now, random))
  const total = weights.reduce((sum, w) => sum + w, 0)
  let target = random() * total
  for (let i = 0; i < pool.length; i++) {
    target -= weights[i]
    if (target <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}
