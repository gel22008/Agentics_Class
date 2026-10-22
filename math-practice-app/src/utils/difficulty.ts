import type { DifficultyLevel } from '../types'

interface Range {
  min: number
  max: number
}

export interface DifficultyRules {
  /** Short description shown on the setup page. */
  description: string
  addition: { operand: Range; maxSum: number }
  /** First number range; the second number is never bigger than the first. */
  subtraction: { minuend: Range }
  /** Advanced uses one small factor and one bigger factor. */
  multiplication: { factorA: Range; factorB: Range }
  /** Questions are built as divisor × quotient so they always divide evenly. */
  division: { divisor: Range; quotient: Range }
}

export const DIFFICULTY_RULES: Record<DifficultyLevel, DifficultyRules> = {
  beginner: {
    description: 'Numbers 0–10. Times tables up to 5.',
    addition: { operand: { min: 0, max: 10 }, maxSum: 10 },
    subtraction: { minuend: { min: 0, max: 10 } },
    multiplication: { factorA: { min: 0, max: 5 }, factorB: { min: 0, max: 5 } },
    division: { divisor: { min: 1, max: 5 }, quotient: { min: 0, max: 5 } },
  },
  easy: {
    description: 'Numbers up to 20. Times tables up to 10.',
    addition: { operand: { min: 0, max: 20 }, maxSum: 20 },
    subtraction: { minuend: { min: 0, max: 20 } },
    multiplication: { factorA: { min: 0, max: 10 }, factorB: { min: 0, max: 10 } },
    division: { divisor: { min: 1, max: 10 }, quotient: { min: 0, max: 10 } },
  },
  intermediate: {
    description: 'Two-digit numbers up to 100. Times tables up to 12.',
    addition: { operand: { min: 10, max: 90 }, maxSum: 100 },
    subtraction: { minuend: { min: 10, max: 100 } },
    multiplication: { factorA: { min: 2, max: 12 }, factorB: { min: 2, max: 12 } },
    division: { divisor: { min: 2, max: 12 }, quotient: { min: 1, max: 12 } },
  },
  advanced: {
    description: 'Numbers up to 1,000. Multiply and divide with bigger numbers.',
    addition: { operand: { min: 100, max: 900 }, maxSum: 1000 },
    subtraction: { minuend: { min: 100, max: 1000 } },
    multiplication: { factorA: { min: 2, max: 12 }, factorB: { min: 10, max: 25 } },
    division: { divisor: { min: 2, max: 12 }, quotient: { min: 10, max: 25 } },
  },
}
