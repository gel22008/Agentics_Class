import type { DifficultyLevel, MathOperation, MistakePattern, Question } from '../types'
import { DIFFICULTY_RULES } from '../utils/difficulty'
import { pickRandom, type RandomSource } from '../utils/random'
import {
  buildQuestion,
  computeAnswer,
  createPatternKey,
  validateQuestion,
} from './questionGenerator'

type Operands = [number, number]
type Candidate = { operation: MathOperation; operands: Operands }

const within = (n: number, range: { min: number; max: number }) => n >= range.min && n <= range.max

/** True when a question fits the number ranges of a difficulty level. */
export function isWithinDifficulty(
  operation: MathOperation,
  a: number,
  b: number,
  difficulty: DifficultyLevel,
): boolean {
  if (!Number.isInteger(a) || !Number.isInteger(b) || a < 0 || b < 0) return false
  const rules = DIFFICULTY_RULES[difficulty]
  switch (operation) {
    case 'addition':
      return (
        within(a, rules.addition.operand) &&
        within(b, rules.addition.operand) &&
        a + b <= rules.addition.maxSum
      )
    case 'subtraction':
      return within(a, rules.subtraction.minuend) && b <= a
    case 'multiplication': {
      const { factorA, factorB } = rules.multiplication
      return (
        (within(a, factorA) && within(b, factorB)) || (within(a, factorB) && within(b, factorA))
      )
    }
    case 'division':
      return (
        b > 0 &&
        a % b === 0 &&
        within(b, rules.division.divisor) &&
        within(a / b, rules.division.quotient)
      )
  }
}

/** Questions with one number changed by 1 or 2, e.g. 8 × 7 → 8 × 6 or 9 × 7. */
export function nearbyCandidates(operation: MathOperation, a: number, b: number): Candidate[] {
  const deltas = [-2, -1, 1, 2]
  if (operation === 'division') {
    // Keep division whole: change the divisor or the quotient, then rebuild the dividend.
    const quotient = a / b
    return deltas.flatMap((d) => [
      { operation, operands: [b * (quotient + d), b] as Operands },
      { operation, operands: [(b + d) * quotient, b + d] as Operands },
    ])
  }
  return deltas.flatMap((d) => [
    { operation, operands: [a + d, b] as Operands },
    { operation, operands: [a, b + d] as Operands },
  ])
}

/** Same numbers in the other order. Only for + and ×, where order does not change the answer. */
export function reversedCandidates(operation: MathOperation, a: number, b: number): Candidate[] {
  if ((operation === 'addition' || operation === 'multiplication') && a !== b) {
    return [{ operation, operands: [b, a] }]
  }
  return []
}

/** Related facts from the same family, e.g. 8 × 7 = 56 → 56 ÷ 7 and 56 ÷ 8. */
export function factFamilyCandidates(operation: MathOperation, a: number, b: number): Candidate[] {
  const c = computeAnswer(operation, a, b)
  switch (operation) {
    case 'multiplication':
      return [
        { operation: 'division', operands: [c, b] },
        { operation: 'division', operands: [c, a] },
      ]
    case 'division':
      return [
        { operation: 'multiplication', operands: [b, c] },
        { operation: 'multiplication', operands: [c, b] },
      ]
    case 'addition':
      return [
        { operation: 'subtraction', operands: [c, a] },
        { operation: 'subtraction', operands: [c, b] },
      ]
    case 'subtraction':
      return [
        { operation: 'addition', operands: [c, b] },
        { operation: 'addition', operands: [b, c] },
      ]
  }
}

/** All valid similar questions for a pattern, staying within its difficulty level. */
export function similarCandidates(pattern: MistakePattern): Candidate[] {
  const { operation, operandA: a, operandB: b, difficulty } = pattern
  const all = [
    ...nearbyCandidates(operation, a, b),
    ...reversedCandidates(operation, a, b),
    ...factFamilyCandidates(operation, a, b),
  ]
  const seen = new Set<string>()
  return all.filter(({ operation: op, operands: [x, y] }) => {
    const key = createPatternKey(op, x, y)
    if (seen.has(key) || !isWithinDifficulty(op, x, y, difficulty)) return false
    seen.add(key)
    return true
  })
}

/**
 * Generates a mistake-review question related to a pattern. It avoids repeating the original
 * question (and the previous one) when other options exist.
 */
export function generateSimilarQuestion(
  pattern: MistakePattern,
  {
    random = Math.random,
    avoidPatternKey,
  }: { random?: RandomSource; avoidPatternKey?: string } = {},
): Question {
  const candidates = similarCandidates(pattern)
  const fresh = candidates.filter(
    (c) =>
      createPatternKey(c.operation, ...c.operands) !== avoidPatternKey &&
      createPatternKey(c.operation, ...c.operands) !== pattern.patternKey,
  )
  const options = fresh.length > 0 ? fresh : candidates
  const choice: Candidate =
    options.length > 0
      ? pickRandom(options, random)
      : { operation: pattern.operation, operands: [pattern.operandA, pattern.operandB] }

  const question = buildQuestion(choice.operation, pattern.difficulty, ...choice.operands, {
    source: 'mistake-review',
    mistakePatternId: pattern.id,
    random,
  })
  if (validateQuestion(question).length === 0) return question
  return buildQuestion(pattern.operation, pattern.difficulty, pattern.operandA, pattern.operandB, {
    source: 'mistake-review',
    mistakePatternId: pattern.id,
    random,
  })
}
