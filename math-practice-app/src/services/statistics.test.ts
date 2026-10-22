import type { DifficultyLevel, MathOperation, PracticeAttempt } from '../types'
import {
  calculateStatistics,
  mostMissedFacts,
  mostMissedOperations,
  statisticsByDifficulty,
  statisticsByOperation,
  totalsFor,
} from './statistics'

let n = 0
function attempt(
  operation: MathOperation,
  a: number,
  b: number,
  right: boolean,
  difficulty: DifficultyLevel = 'easy',
): PracticeAttempt {
  n += 1
  return {
    id: `a${n}`,
    sessionId: 's1',
    questionId: `q${n}`,
    operation,
    difficulty,
    operandA: a,
    operandB: b,
    correctAnswer: 0,
    selectedAnswer: 0,
    selfReportedCorrect: right,
    selectedAnswerWasCorrect: right,
    patternKey: `${operation}:${a}:${b}`,
    source: 'new',
    attemptedAt: new Date(Date.UTC(2026, 9, 21, 12, 0, n)).toISOString(),
  }
}

describe('statistics calculations', () => {
  it('handles zero attempts without dividing by zero', () => {
    expect(totalsFor([])).toEqual({ attempted: 0, correct: 0, incorrect: 0, accuracy: 0 })
    const stats = calculateStatistics([], [])
    expect(stats.overall.accuracy).toBe(0)
    expect(stats.mostMissedOperations).toEqual([])
    expect(stats.mostMissedFacts).toEqual([])
  })

  it('totals attempted, correct, incorrect and accuracy', () => {
    const list = [
      attempt('addition', 1, 2, true),
      attempt('addition', 3, 4, false),
      attempt('division', 6, 3, true),
    ]
    expect(totalsFor(list)).toEqual({ attempted: 3, correct: 2, incorrect: 1, accuracy: 67 })
  })

  it('splits results by operation and by difficulty', () => {
    const list = [
      attempt('addition', 1, 2, true, 'beginner'),
      attempt('subtraction', 5, 2, false, 'advanced'),
      attempt('subtraction', 7, 2, true, 'advanced'),
    ]
    const byOp = statisticsByOperation(list)
    expect(byOp.addition).toMatchObject({ attempted: 1, correct: 1, accuracy: 100 })
    expect(byOp.subtraction).toMatchObject({ attempted: 2, incorrect: 1, accuracy: 50 })
    expect(byOp.multiplication.attempted).toBe(0)

    const byLevel = statisticsByDifficulty(list)
    expect(byLevel.beginner.attempted).toBe(1)
    expect(byLevel.advanced).toMatchObject({ attempted: 2, correct: 1 })
    expect(byLevel.intermediate.attempted).toBe(0)
  })

  it('finds the most missed operation and reports ties', () => {
    const list = [
      attempt('subtraction', 5, 2, false),
      attempt('subtraction', 7, 2, false),
      attempt('division', 6, 3, false),
    ]
    expect(mostMissedOperations(list)).toEqual(['subtraction'])
    list.push(attempt('division', 8, 4, false))
    expect(mostMissedOperations(list)).toEqual(['subtraction', 'division'])
  })

  it('lists missed facts by miss count, highest first, up to 12', () => {
    const list = [
      attempt('multiplication', 8, 7, false),
      attempt('multiplication', 8, 7, false),
      attempt('multiplication', 8, 7, false),
      attempt('addition', 9, 6, false),
      attempt('addition', 9, 6, true),
      attempt('subtraction', 12, 5, false),
      attempt('subtraction', 12, 5, false),
    ]
    const facts = mostMissedFacts(list)
    expect(facts.map((f) => [f.displayText, f.incorrectCount])).toEqual([
      ['8 × 7', 3],
      ['12 − 5', 2],
      ['9 + 6', 1],
    ])

    const many = Array.from({ length: 20 }, (_, i) => attempt('addition', i, 1, false))
    expect(mostMissedFacts(many)).toHaveLength(12)
  })

  it('breaks ties by the most recent mistake', () => {
    const list = [attempt('addition', 1, 1, false), attempt('addition', 2, 2, false)]
    expect(mostMissedFacts(list).map((f) => f.displayText)).toEqual(['2 + 2', '1 + 1'])
  })
})
