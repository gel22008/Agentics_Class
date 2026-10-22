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

/** Number ranges for each level, following specification.md section 7. */
export const DIFFICULTY_RULES: Record<DifficultyLevel, DifficultyRules> = {
  // 7.1 Beginner: +/- numbers 0–10 (sums up to 20), × factors 0–5, ÷ divisors 1–5.
  beginner: {
    description: 'Numbers 0–10. Times tables up to 5.',
    addition: { operand: { min: 0, max: 10 }, maxSum: 20 },
    subtraction: { minuend: { min: 0, max: 10 } },
    multiplication: { factorA: { min: 0, max: 5 }, factorB: { min: 0, max: 5 } },
    division: { divisor: { min: 1, max: 5 }, quotient: { min: 0, max: 10 } },
  },
  // 7.2 Easy: +/- numbers 0–50 (sums up to 100), × factors 0–10, ÷ divisors 1–10.
  easy: {
    description: 'Numbers up to 50. Times tables up to 10.',
    addition: { operand: { min: 0, max: 50 }, maxSum: 100 },
    subtraction: { minuend: { min: 0, max: 50 } },
    multiplication: { factorA: { min: 0, max: 10 }, factorB: { min: 0, max: 10 } },
    division: { divisor: { min: 1, max: 10 }, quotient: { min: 0, max: 10 } },
  },
  // 7.3 Intermediate: +/- numbers 0–100 (carrying/borrowing), one-digit × one- or two-digit,
  // ÷ divisors 1–12 with dividends up to 144 (12 × 12).
  intermediate: {
    description: 'Numbers up to 100. One-digit × two-digit. Divide up to 144.',
    addition: { operand: { min: 0, max: 100 }, maxSum: 200 },
    subtraction: { minuend: { min: 0, max: 100 } },
    multiplication: { factorA: { min: 0, max: 9 }, factorB: { min: 0, max: 99 } },
    division: { divisor: { min: 1, max: 12 }, quotient: { min: 0, max: 12 } },
  },
  // 7.4 Advanced: multi-digit +/- up to 1,000 (no negative answers in this release),
  // two-digit × one- or two-digit, larger dividends with one- or two-digit divisors.
  advanced: {
    description: 'Numbers up to 1,000. Two-digit × two-digit. Bigger division.',
    addition: { operand: { min: 10, max: 1000 }, maxSum: 2000 },
    subtraction: { minuend: { min: 10, max: 1000 } },
    multiplication: { factorA: { min: 2, max: 99 }, factorB: { min: 10, max: 99 } },
    division: { divisor: { min: 2, max: 99 }, quotient: { min: 2, max: 99 } },
  },
}
