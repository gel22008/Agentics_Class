import type {
  AppStatistics,
  DifficultyLevel,
  DifficultyStatistics,
  MathOperation,
  MissedFact,
  OperationStatistics,
  PracticeAttempt,
  ResultTotals,
  SessionSummary,
} from '../types'
import { DIFFICULTY_LEVELS, MATH_OPERATIONS } from '../types'
import { calculateAccuracy } from '../utils/stats'
import { formatQuestionText } from './questionGenerator'

export const RECENT_SESSION_LIMIT = 10
export const MOST_MISSED_FACT_LIMIT = 12

/** Totals for a list of attempts. Statistics use the child's self-reported result. */
export function totalsFor(attempts: readonly PracticeAttempt[]): ResultTotals {
  const attempted = attempts.length
  const correct = attempts.filter((a) => a.selfReportedCorrect).length
  return {
    attempted,
    correct,
    incorrect: attempted - correct,
    accuracy: calculateAccuracy(correct, attempted),
  }
}

export function statisticsByOperation(attempts: readonly PracticeAttempt[]): OperationStatistics {
  return Object.fromEntries(
    MATH_OPERATIONS.map((op) => [op, totalsFor(attempts.filter((a) => a.operation === op))]),
  ) as OperationStatistics
}

export function statisticsByDifficulty(attempts: readonly PracticeAttempt[]): DifficultyStatistics {
  return Object.fromEntries(
    DIFFICULTY_LEVELS.map((level) => [
      level,
      totalsFor(attempts.filter((a) => a.difficulty === level)),
    ]),
  ) as Record<DifficultyLevel, ResultTotals>
}

/**
 * Operation(s) with the most incorrect answers. Returns every operation tied for the most,
 * or an empty list when there are no mistakes.
 */
export function mostMissedOperations(attempts: readonly PracticeAttempt[]): MathOperation[] {
  const byOperation = statisticsByOperation(attempts)
  const highest = Math.max(...MATH_OPERATIONS.map((op) => byOperation[op].incorrect))
  if (highest === 0) return []
  return MATH_OPERATIONS.filter((op) => byOperation[op].incorrect === highest)
}

/**
 * Number facts answered incorrectly most often, highest first. Ties are broken by the most
 * recent mistake, then alphabetically, so the order is always stable.
 */
export function mostMissedFacts(
  attempts: readonly PracticeAttempt[],
  limit = MOST_MISSED_FACT_LIMIT,
): MissedFact[] {
  const facts = new Map<string, MissedFact & { lastMissedAt: string }>()
  for (const attempt of attempts) {
    if (attempt.selfReportedCorrect) continue
    const existing = facts.get(attempt.patternKey)
    if (existing) {
      existing.incorrectCount += 1
      if (attempt.attemptedAt > existing.lastMissedAt) existing.lastMissedAt = attempt.attemptedAt
    } else {
      facts.set(attempt.patternKey, {
        patternKey: attempt.patternKey,
        displayText: formatQuestionText(attempt.operation, attempt.operandA, attempt.operandB),
        operation: attempt.operation,
        incorrectCount: 1,
        lastMissedAt: attempt.attemptedAt,
      })
    }
  }
  return [...facts.values()]
    .sort(
      (a, b) =>
        b.incorrectCount - a.incorrectCount ||
        b.lastMissedAt.localeCompare(a.lastMissedAt) ||
        a.displayText.localeCompare(b.displayText),
    )
    .slice(0, limit)
    .map(({ patternKey, displayText, operation, incorrectCount }) => ({
      patternKey,
      displayText,
      operation,
      incorrectCount,
    }))
}

/** Everything the Statistics page shows, calculated from saved attempts and sessions. */
export function calculateStatistics(
  attempts: readonly PracticeAttempt[],
  sessions: readonly SessionSummary[],
): AppStatistics {
  const missed = mostMissedOperations(attempts)
  return {
    overall: totalsFor(attempts),
    byOperation: statisticsByOperation(attempts),
    byDifficulty: statisticsByDifficulty(attempts),
    recentSessions: [...sessions]
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
      .slice(0, RECENT_SESSION_LIMIT),
    mistakes: {
      activeCount: 0,
      masteredCount: 0,
      similarQuestionsPracticed: 0,
      similarQuestionsCorrect: 0,
    },
    mostMissedOperations: missed,
    mostMissedFacts: mostMissedFacts(attempts),
  }
}
