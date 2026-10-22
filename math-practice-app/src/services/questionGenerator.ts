import type { DifficultyLevel, MathOperation, Question, QuestionSource } from '../types'
import { OPERATION_SYMBOLS } from '../types'
import { DIFFICULTY_RULES } from '../utils/difficulty'
import { createId, pickRandom, randomInt, type RandomSource } from '../utils/random'
import { generateAnswerChoices } from './answerChoices'

export function computeAnswer(operation: MathOperation, a: number, b: number): number {
  switch (operation) {
    case 'addition':
      return a + b
    case 'subtraction':
      return a - b
    case 'multiplication':
      return a * b
    case 'division':
      return a / b
  }
}

export function formatQuestionText(operation: MathOperation, a: number, b: number): string {
  return `${a} ${OPERATION_SYMBOLS[operation]} ${b}`
}

/** Plain-language explanation for the back of the card, e.g. "Add 6 and 0 together to get 6." */
export function explainQuestion(operation: MathOperation, a: number, b: number): string {
  const answer = computeAnswer(operation, a, b)
  switch (operation) {
    case 'addition':
      return `Add ${a} and ${b} together to get ${answer}.`
    case 'subtraction':
      return `Start with ${a} and take away ${b} to get ${answer}.`
    case 'multiplication':
      return `${a} groups of ${b} make ${answer}.`
    case 'division':
      return `Split ${a} into ${b} equal groups to get ${answer} in each group.`
  }
}

export function createPatternKey(operation: MathOperation, a: number, b: number): string {
  return `${operation}:${a}:${b}`
}

interface BuildOptions {
  source?: QuestionSource
  mistakePatternId?: string
  random?: RandomSource
}

/** Turns two operands into a complete Question with choices, text and explanation. */
export function buildQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  operandA: number,
  operandB: number,
  { source = 'new', mistakePatternId, random = Math.random }: BuildOptions = {},
): Question {
  const correctAnswer = computeAnswer(operation, operandA, operandB)
  return {
    id: createId('q'),
    operation,
    difficulty,
    operandA,
    operandB,
    correctAnswer,
    choices: generateAnswerChoices(operation, operandA, operandB, correctAnswer, random),
    displayText: formatQuestionText(operation, operandA, operandB),
    explanation: explainQuestion(operation, operandA, operandB),
    patternKey: createPatternKey(operation, operandA, operandB),
    source,
    ...(mistakePatternId ? { mistakePatternId } : {}),
  }
}

// ---------- Operation-specific operand generators ----------

type Operands = [number, number]

export function generateAdditionOperands(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Operands {
  const { operand, maxSum } = DIFFICULTY_RULES[difficulty].addition
  const a = randomInt(operand.min, Math.min(operand.max, maxSum - operand.min), random)
  const b = randomInt(operand.min, Math.min(operand.max, maxSum - a), random)
  return [a, b]
}

export function generateSubtractionOperands(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Operands {
  const { minuend } = DIFFICULTY_RULES[difficulty].subtraction
  const a = randomInt(minuend.min, minuend.max, random)
  // Second number is never bigger than the first, so answers are never negative.
  const b = randomInt(0, a, random)
  return [a, b]
}

export function generateMultiplicationOperands(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Operands {
  const { factorA, factorB } = DIFFICULTY_RULES[difficulty].multiplication
  const small = randomInt(factorA.min, factorA.max, random)
  const big = randomInt(factorB.min, factorB.max, random)
  // Randomize order so "3 × 15" and "15 × 3" both appear.
  return random() < 0.5 ? [small, big] : [big, small]
}

export function generateDivisionOperands(
  difficulty: DifficultyLevel,
  random: RandomSource = Math.random,
): Operands {
  const { divisor: divisorRange, quotient: quotientRange } = DIFFICULTY_RULES[difficulty].division
  const divisor = randomInt(Math.max(1, divisorRange.min), divisorRange.max, random)
  const quotient = randomInt(quotientRange.min, quotientRange.max, random)
  // Build dividend from divisor × quotient so the answer is always a whole number.
  return [divisor * quotient, divisor]
}

const OPERAND_GENERATORS: Record<
  MathOperation,
  (difficulty: DifficultyLevel, random?: RandomSource) => Operands
> = {
  addition: generateAdditionOperands,
  subtraction: generateSubtractionOperands,
  multiplication: generateMultiplicationOperands,
  division: generateDivisionOperands,
}

// ---------- Validation ----------

/** Checks every rule a question must follow. Returns a list of problems (empty = valid). */
export function validateQuestion(question: Question): string[] {
  const problems: string[] = []
  const { operation, operandA, operandB, correctAnswer, choices } = question

  if (!Number.isInteger(operandA) || !Number.isInteger(operandB)) {
    problems.push('Operands must be whole numbers.')
  }
  if (operandA < 0 || operandB < 0) problems.push('Operands must not be negative.')
  if (operation === 'division' && operandB === 0) problems.push('Cannot divide by zero.')
  if (correctAnswer !== computeAnswer(operation, operandA, operandB)) {
    problems.push('Correct answer does not match the question.')
  }
  if (!Number.isInteger(correctAnswer)) problems.push('Answer must be a whole number.')
  if (correctAnswer < 0) problems.push('Answer must not be negative.')
  if (choices.length !== 4) problems.push('There must be exactly four choices.')
  if (new Set(choices).size !== choices.length) problems.push('Choices must be unique.')
  if (choices.filter((c) => c === correctAnswer).length !== 1) {
    problems.push('The correct answer must appear exactly once.')
  }
  if (choices.some((c) => !Number.isInteger(c) || c < 0)) {
    problems.push('Choices must be whole numbers that are not negative.')
  }
  return problems
}

export const MAX_GENERATION_ATTEMPTS = 20

/** A simple, always-valid question used if generation keeps failing. */
export function createFallbackQuestion(operation: MathOperation, difficulty: DifficultyLevel) {
  const operands: Record<MathOperation, Operands> = {
    addition: [2, 3],
    subtraction: [5, 2],
    multiplication: [2, 3],
    division: [6, 2],
  }
  const [a, b] = operands[operation]
  return buildQuestion(operation, difficulty, a, b)
}

interface GenerateOptions {
  random?: RandomSource
  /** Pattern key of the previous question, so the same problem isn't shown twice in a row. */
  avoidPatternKey?: string
}

/** Generates one valid question for an operation and difficulty. */
export function generateQuestion(
  operation: MathOperation,
  difficulty: DifficultyLevel,
  { random = Math.random, avoidPatternKey }: GenerateOptions = {},
): Question {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    try {
      const [a, b] = OPERAND_GENERATORS[operation](difficulty, random)
      const question = buildQuestion(operation, difficulty, a, b, { random })
      if (question.patternKey === avoidPatternKey) continue
      const problems = validateQuestion(question)
      if (problems.length === 0) return question
      if (import.meta.env.DEV) {
        console.warn('Invalid question generated, retrying:', question.displayText, problems)
      }
    } catch (error) {
      if (import.meta.env.DEV) console.warn('Question generation failed, retrying:', error)
    }
  }
  if (import.meta.env.DEV) {
    console.error(`Falling back to a default ${operation} question after repeated failures.`)
  }
  return createFallbackQuestion(operation, difficulty)
}

/** Picks one of the selected operations at random and generates a question for it. */
export function generateQuestionForOperations(
  operations: readonly MathOperation[],
  difficulty: DifficultyLevel,
  options: GenerateOptions = {},
): Question {
  if (operations.length === 0) {
    throw new Error('At least one operation must be selected.')
  }
  const operation = pickRandom(operations, options.random)
  return generateQuestion(operation, difficulty, options)
}
