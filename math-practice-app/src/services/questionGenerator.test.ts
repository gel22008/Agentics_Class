import type { DifficultyLevel, MathOperation } from '../types'
import { DIFFICULTY_LEVELS, MATH_OPERATIONS } from '../types'
import { DIFFICULTY_RULES } from '../utils/difficulty'
import {
  createFallbackQuestion,
  explainQuestion,
  generateAdditionOperands,
  generateDivisionOperands,
  generateMultiplicationOperands,
  generateQuestion,
  generateQuestionForOperations,
  generateSubtractionOperands,
  validateQuestion,
} from './questionGenerator'

const RUNS = 300

describe('addition questions', () => {
  it.each(DIFFICULTY_LEVELS)('%s: operands and sum stay within the level rules', (level) => {
    const { operand, maxSum } = DIFFICULTY_RULES[level].addition
    for (let i = 0; i < RUNS; i++) {
      const [a, b] = generateAdditionOperands(level)
      expect(a).toBeGreaterThanOrEqual(operand.min)
      expect(a).toBeLessThanOrEqual(operand.max)
      expect(b).toBeGreaterThanOrEqual(operand.min)
      expect(b).toBeLessThanOrEqual(operand.max)
      expect(a + b).toBeLessThanOrEqual(maxSum)
    }
  })

  it('can reach the minimum and maximum operands at beginner level', () => {
    expect(generateAdditionOperands('beginner', () => 0)).toEqual([0, 0])
    const [a] = generateAdditionOperands('beginner', () => 0.9999)
    expect(a).toBe(10)
  })
})

describe('subtraction questions', () => {
  it.each(DIFFICULTY_LEVELS)('%s: first number is never smaller than the second', (level) => {
    const { minuend } = DIFFICULTY_RULES[level].subtraction
    for (let i = 0; i < RUNS; i++) {
      const [a, b] = generateSubtractionOperands(level)
      expect(a).toBeGreaterThanOrEqual(b)
      expect(a - b).toBeGreaterThanOrEqual(0)
      expect(a).toBeGreaterThanOrEqual(minuend.min)
      expect(a).toBeLessThanOrEqual(minuend.max)
    }
  })
})

describe('multiplication questions', () => {
  it.each(DIFFICULTY_LEVELS)('%s: factors stay within the level ranges', (level) => {
    const { factorA, factorB } = DIFFICULTY_RULES[level].multiplication
    const inA = (n: number) => n >= factorA.min && n <= factorA.max
    const inB = (n: number) => n >= factorB.min && n <= factorB.max
    for (let i = 0; i < RUNS; i++) {
      const [a, b] = generateMultiplicationOperands(level)
      expect((inA(a) && inB(b)) || (inB(a) && inA(b))).toBe(true)
    }
  })
})

describe('division questions', () => {
  it.each(DIFFICULTY_LEVELS)(
    '%s: never divides by zero and always gives whole numbers',
    (level) => {
      const { divisor, quotient } = DIFFICULTY_RULES[level].division
      for (let i = 0; i < RUNS; i++) {
        const [dividend, d] = generateDivisionOperands(level)
        expect(d).not.toBe(0)
        expect(Number.isInteger(dividend / d)).toBe(true)
        expect(d).toBeGreaterThanOrEqual(divisor.min)
        expect(d).toBeLessThanOrEqual(divisor.max)
        expect(dividend / d).toBeGreaterThanOrEqual(quotient.min)
        expect(dividend / d).toBeLessThanOrEqual(quotient.max)
      }
    },
  )
})

describe('generateQuestion', () => {
  const combos: [MathOperation, DifficultyLevel][] = MATH_OPERATIONS.flatMap((op) =>
    DIFFICULTY_LEVELS.map((level): [MathOperation, DifficultyLevel] => [op, level]),
  )

  it.each(combos)('%s / %s produces only valid questions', (operation, difficulty) => {
    for (let i = 0; i < 100; i++) {
      const q = generateQuestion(operation, difficulty)
      expect(validateQuestion(q)).toEqual([])
      expect(q.operation).toBe(operation)
      expect(q.difficulty).toBe(difficulty)
      expect(q.source).toBe('new')
      expect(q.patternKey).toBe(`${operation}:${q.operandA}:${q.operandB}`)
      expect(q.displayText).toContain(String(q.operandA))
    }
  })

  it('avoids repeating the previous question', () => {
    for (let i = 0; i < 100; i++) {
      const first = generateQuestion('addition', 'beginner')
      const next = generateQuestion('addition', 'beginner', { avoidPatternKey: first.patternKey })
      expect(next.patternKey).not.toBe(first.patternKey)
    }
  })

  it('uses only the selected operations when several are chosen', () => {
    const allowed: MathOperation[] = ['subtraction', 'division']
    const seen = new Set<MathOperation>()
    for (let i = 0; i < 200; i++) {
      const q = generateQuestionForOperations(allowed, 'easy')
      expect(allowed).toContain(q.operation)
      seen.add(q.operation)
    }
    expect(seen.size).toBe(2)
  })

  it('refuses to generate with no operations selected', () => {
    expect(() => generateQuestionForOperations([], 'easy')).toThrow()
  })

  it('falls back to a valid question when generation keeps failing', () => {
    const fallback = createFallbackQuestion('division', 'advanced')
    expect(validateQuestion(fallback)).toEqual([])
  })
})

describe('explanations', () => {
  it('describes the equation in words', () => {
    expect(explainQuestion('addition', 6, 0)).toBe('Add 6 and 0 together to get 6.')
    expect(explainQuestion('subtraction', 9, 3)).toBe('Start with 9 and take away 3 to get 6.')
    expect(explainQuestion('multiplication', 8, 7)).toBe('8 groups of 7 make 56.')
    expect(explainQuestion('division', 56, 7)).toBe(
      'Split 56 into 7 equal groups to get 8 in each group.',
    )
  })
})

describe('validateQuestion', () => {
  it('catches broken questions', () => {
    const good = generateQuestion('addition', 'easy')
    expect(validateQuestion({ ...good, correctAnswer: good.correctAnswer + 1 })).not.toEqual([])
    expect(validateQuestion({ ...good, choices: [1, 1, 2, 3] })).not.toEqual([])
    expect(validateQuestion({ ...good, choices: good.choices.slice(0, 3) })).not.toEqual([])
  })
})
