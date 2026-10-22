/** The four arithmetic operations the app supports. */
export type MathOperation = 'addition' | 'subtraction' | 'multiplication' | 'division'

export const MATH_OPERATIONS: readonly MathOperation[] = [
  'addition',
  'subtraction',
  'multiplication',
  'division',
]

export const OPERATION_SYMBOLS: Record<MathOperation, string> = {
  addition: '+',
  subtraction: '−',
  multiplication: '×',
  division: '÷',
}

export const OPERATION_LABELS: Record<MathOperation, string> = {
  addition: 'Addition',
  subtraction: 'Subtraction',
  multiplication: 'Multiplication',
  division: 'Division',
}

/** Difficulty levels, in order from easiest (level 1) to hardest (level 4). */
export type DifficultyLevel = 'beginner' | 'easy' | 'intermediate' | 'advanced'

export const DIFFICULTY_LEVELS: readonly DifficultyLevel[] = [
  'beginner',
  'easy',
  'intermediate',
  'advanced',
]

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  beginner: 'Beginner',
  easy: 'Easy',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

/** Where a question came from: normal practice or a review of a past mistake. */
export type QuestionSource = 'new' | 'mistake-review'

/** One arithmetic problem shown on a practice card. */
export interface Question {
  id: string
  operation: MathOperation
  difficulty: DifficultyLevel
  /** Left-hand number, e.g. 8 in "8 × 7". */
  operandA: number
  /** Right-hand number, e.g. 7 in "8 × 7". */
  operandB: number
  correctAnswer: number
  /** Exactly four unique whole numbers, shuffled, including the correct answer once. */
  choices: number[]
  /** The problem as shown to the child, e.g. "8 × 7". */
  displayText: string
  /** Plain-language explanation shown on the back of the card. */
  explanation: string
  /** Identifies the math fact (e.g. "multiplication:8:7") for mistake tracking. */
  patternKey: string
  source: QuestionSource
  /** Set when source is 'mistake-review': the pattern this question was generated from. */
  mistakePatternId?: string
}
