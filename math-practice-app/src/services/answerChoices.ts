import type { MathOperation } from '../types'
import { randomInt, shuffle, type RandomSource } from '../utils/random'

export const DISTRACTOR_COUNT = 3
const MAX_RANDOM_TRIES = 100

const isValidChoice = (value: number) => Number.isInteger(value) && value >= 0

/** How far a wrong answer may be from the right one and still look believable. */
export function maxDistractorDistance(answer: number): number {
  return Math.max(5, Math.ceil(answer * 0.5))
}

/** Answers that are one or a few steps away from the right one. */
export function nearbyDistractors(answer: number): number[] {
  const candidates = [answer + 1, answer - 1, answer + 2, answer - 2]
  if (answer >= 10) candidates.push(answer + 10, answer - 10)
  return candidates
}

/** Common mistakes for each operation, so wrong choices look believable. */
export function operationDistractors(operation: MathOperation, a: number, b: number): number[] {
  switch (operation) {
    case 'addition':
      // Off by one, forgot to carry (off by ten), or subtracted instead of adding.
      return [a + b + 1, a + b - 1, a + b + 10, a + b - 10, Math.abs(a - b)]
    case 'subtraction':
      // Added instead of subtracting, off by one, or borrowing slip (off by ten).
      return [a + b, a - b + 1, a - b - 1, a - b + 10, a - b - 10]
    case 'multiplication':
      // Neighboring facts in the times table, or added instead of multiplying.
      return [a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b, a + b]
    case 'division': {
      // Neighboring quotients, or confusing the divisor with the answer (fact family).
      const quotient = a / b
      return [quotient + 1, quotient - 1, quotient + 2, b, a - b]
    }
  }
}

/**
 * Picks three wrong answers that are unique, whole, not negative, not the correct
 * answer, and close enough to be believable.
 */
export function generateDistractors(
  operation: MathOperation,
  a: number,
  b: number,
  answer: number,
  random: RandomSource = Math.random,
): number[] {
  const chosen = new Set<number>()
  const maxDistance = maxDistractorDistance(answer)
  const accept = (value: number) => {
    if (
      chosen.size < DISTRACTOR_COUNT &&
      isValidChoice(value) &&
      value !== answer &&
      Math.abs(value - answer) <= maxDistance
    ) {
      chosen.add(value)
    }
  }

  // 1) Mistake-style distractors first (randomized so the same ones aren't always used).
  shuffle(operationDistractors(operation, a, b), random).forEach(accept)
  // 2) Then nearby numbers.
  shuffle(nearbyDistractors(answer), random).forEach(accept)
  // 3) Then random numbers close to the answer, with a retry limit to avoid infinite loops.
  const spread = Math.max(5, Math.ceil(answer * 0.25))
  for (let tries = 0; chosen.size < DISTRACTOR_COUNT && tries < MAX_RANDOM_TRIES; tries++) {
    accept(randomInt(Math.max(0, answer - spread), answer + spread, random))
  }
  // 4) Guaranteed fallback: count upward from the answer.
  for (let next = answer + 1; chosen.size < DISTRACTOR_COUNT; next++) accept(next)

  return [...chosen]
}

/** Four shuffled choices: the correct answer exactly once plus three distractors. */
export function generateAnswerChoices(
  operation: MathOperation,
  a: number,
  b: number,
  answer: number,
  random: RandomSource = Math.random,
): number[] {
  return shuffle([answer, ...generateDistractors(operation, a, b, answer, random)], random)
}
