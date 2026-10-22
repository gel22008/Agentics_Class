import type { MathOperation } from '../types'
import { DIFFICULTY_LEVELS, MATH_OPERATIONS } from '../types'
import { generateAnswerChoices, generateDistractors, maxDistractorDistance } from './answerChoices'
import { generateQuestion } from './questionGenerator'

describe('generateDistractors', () => {
  it.each(MATH_OPERATIONS)('%s: three unique, whole, non-negative wrong answers', (operation) => {
    for (const level of DIFFICULTY_LEVELS) {
      for (let i = 0; i < 100; i++) {
        const q = generateQuestion(operation, level)
        const wrong = generateDistractors(operation, q.operandA, q.operandB, q.correctAnswer)
        expect(wrong).toHaveLength(3)
        expect(new Set(wrong).size).toBe(3)
        expect(wrong).not.toContain(q.correctAnswer)
        for (const w of wrong) {
          expect(Math.abs(w - q.correctAnswer)).toBeLessThanOrEqual(
            maxDistractorDistance(q.correctAnswer),
          )
          expect(Number.isInteger(w)).toBe(true)
          expect(w).toBeGreaterThanOrEqual(0)
        }
      }
    }
  })

  it('keeps distractors plausible (close to the answer)', () => {
    for (let i = 0; i < 200; i++) {
      const wrong = generateDistractors('addition', 40, 30, 70)
      for (const w of wrong) expect(Math.abs(w - 70)).toBeLessThanOrEqual(40)
    }
  })

  const edgeCases: [MathOperation, number, number, number][] = [
    ['addition', 0, 0, 0],
    ['subtraction', 5, 5, 0],
    ['subtraction', 1, 0, 1],
    ['multiplication', 0, 0, 0],
    ['multiplication', 1, 1, 1],
    ['division', 0, 3, 0],
    ['division', 1, 1, 1],
  ]

  it.each(edgeCases)('handles answers near zero: %s %i, %i', (operation, a, b, answer) => {
    for (let i = 0; i < 50; i++) {
      const wrong = generateDistractors(operation, a, b, answer)
      expect(wrong).toHaveLength(3)
      expect(new Set(wrong).size).toBe(3)
      expect(wrong).not.toContain(answer)
      for (const w of wrong) expect(w).toBeGreaterThanOrEqual(0)
    }
  })
})

describe('generateAnswerChoices', () => {
  it('has four choices with the correct answer exactly once', () => {
    for (let i = 0; i < 300; i++) {
      const choices = generateAnswerChoices('multiplication', 8, 7, 56)
      expect(choices).toHaveLength(4)
      expect(new Set(choices).size).toBe(4)
      expect(choices.filter((c) => c === 56)).toHaveLength(1)
    }
  })

  it('does not keep the correct answer in a predictable position', () => {
    const positions = new Set<number>()
    for (let i = 0; i < 300; i++) {
      positions.add(generateAnswerChoices('addition', 3, 4, 7).indexOf(7))
    }
    expect([...positions].sort()).toEqual([0, 1, 2, 3])
  })
})
