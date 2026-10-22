import type { MistakePattern, PracticeAttempt } from '../types'
import {
  applyAttemptToMistakes,
  pickPatternForReview,
  recordMistake,
  recordReviewResult,
} from './mistakes'
import { generateQuestion, validateQuestion } from './questionGenerator'
import {
  factFamilyCandidates,
  generateSimilarQuestion,
  isWithinDifficulty,
  reversedCandidates,
  similarCandidates,
} from './similarQuestions'

const attempt = (overrides: Partial<PracticeAttempt> = {}): PracticeAttempt => ({
  id: 'a1',
  sessionId: 's1',
  questionId: 'q1',
  operation: 'multiplication',
  difficulty: 'easy',
  operandA: 8,
  operandB: 7,
  correctAnswer: 56,
  selectedAnswer: 54,
  selfReportedCorrect: false,
  selectedAnswerWasCorrect: false,
  patternKey: 'multiplication:8:7',
  source: 'new',
  attemptedAt: '2026-10-21T20:00:00.000Z',
  ...overrides,
})

describe('mistake patterns', () => {
  it('creates a pattern after an incorrect answer with all details', () => {
    const [p] = recordMistake([], attempt())
    expect(p).toMatchObject({
      operation: 'multiplication',
      operandA: 8,
      operandB: 7,
      correctAnswer: 56,
      difficulty: 'easy',
      incorrectCount: 1,
      similarCorrectCount: 0,
      status: 'active',
      lastIncorrectAt: '2026-10-21T20:00:00.000Z',
    })
  })

  it('updates an existing pattern instead of creating a duplicate', () => {
    let patterns = recordMistake([], attempt())
    patterns = recordMistake(patterns, attempt({ attemptedAt: '2026-10-21T21:00:00.000Z' }))
    expect(patterns).toHaveLength(1)
    expect(patterns[0].incorrectCount).toBe(2)
    expect(patterns[0].lastIncorrectAt).toBe('2026-10-21T21:00:00.000Z')
  })

  it('ignores correct answers to new questions', () => {
    expect(applyAttemptToMistakes([], attempt({ selfReportedCorrect: true }), 3)).toEqual([])
  })

  it('masters a pattern after the threshold of correct similar answers', () => {
    let patterns = recordMistake([], attempt())
    const id = patterns[0].id
    patterns = recordReviewResult(patterns, id, true, 3, 't1')
    patterns = recordReviewResult(patterns, id, true, 3, 't2')
    expect(patterns[0].status).toBe('active')
    patterns = recordReviewResult(patterns, id, true, 3, 't3')
    expect(patterns[0]).toMatchObject({
      status: 'mastered',
      similarCorrectCount: 3,
      similarPracticedCount: 3,
    })
  })

  it('uses a configurable threshold', () => {
    let patterns = recordMistake([], attempt())
    patterns = recordReviewResult(patterns, patterns[0].id, true, 1, 't1')
    expect(patterns[0].status).toBe('mastered')
  })

  it('resets progress after an incorrect review answer', () => {
    let patterns = recordMistake([], attempt())
    patterns = recordReviewResult(patterns, patterns[0].id, true, 3, 't1')
    patterns = recordReviewResult(patterns, patterns[0].id, false, 3, 't2')
    expect(patterns[0]).toMatchObject({
      similarCorrectCount: 0,
      incorrectCount: 2,
      status: 'active',
    })
  })

  it('lets a mastered pattern return after a future mistake', () => {
    let patterns = recordMistake([], attempt())
    patterns = recordReviewResult(patterns, patterns[0].id, true, 1, 't1')
    expect(patterns[0].status).toBe('mastered')
    patterns = recordMistake(patterns, attempt())
    expect(patterns[0].status).toBe('active')
  })

  it('applies review answers to the original pattern', () => {
    const patterns = recordMistake([], attempt())
    const review = attempt({
      source: 'mistake-review',
      mistakePatternId: patterns[0].id,
      selfReportedCorrect: true,
      patternKey: 'division:56:7',
    })
    const updated = applyAttemptToMistakes(patterns, review, 3)
    expect(updated).toHaveLength(1)
    expect(updated[0].similarCorrectCount).toBe(1)
  })
})

describe('review prioritization', () => {
  const base = recordMistake([], attempt())[0]
  const now = Date.parse('2026-10-21T21:00:00.000Z')

  it('picks frequently missed patterns more often', () => {
    const often: MistakePattern = { ...base, id: 'often', incorrectCount: 10 }
    const rarely: MistakePattern = { ...base, id: 'rarely', incorrectCount: 1 }
    const counts = { often: 0, rarely: 0 }
    for (let i = 0; i < 1000; i++) {
      const picked = pickPatternForReview([often, rarely], 3, { now })!
      counts[picked.id as 'often' | 'rarely'] += 1
    }
    expect(counts.often).toBeGreaterThan(counts.rarely)
  })

  it('picks recently missed patterns more often', () => {
    const recent: MistakePattern = { ...base, id: 'recent' }
    const old: MistakePattern = { ...base, id: 'old', lastIncorrectAt: '2026-09-01T00:00:00.000Z' }
    let recentPicks = 0
    for (let i = 0; i < 1000; i++) {
      if (pickPatternForReview([recent, old], 3, { now })!.id === 'recent') recentPicks += 1
    }
    expect(recentPicks).toBeGreaterThan(500)
  })

  it('does not pick the same pattern twice in a row when there is a choice', () => {
    const a = { ...base, id: 'a', incorrectCount: 50 }
    const b = { ...base, id: 'b' }
    for (let i = 0; i < 100; i++) {
      expect(pickPatternForReview([a, b], 3, { avoidId: 'a', now })!.id).toBe('b')
    }
  })

  it('returns null when there is nothing to review', () => {
    expect(pickPatternForReview([], 3)).toBeNull()
  })
})

describe('similar questions', () => {
  const pattern = recordMistake([], attempt())[0]

  it('includes nearby, reversed and fact-family questions for 8 × 7', () => {
    const keys = similarCandidates(pattern).map(
      (c) => `${c.operation}:${c.operands[0]}:${c.operands[1]}`,
    )
    expect(keys).toEqual(
      expect.arrayContaining([
        'multiplication:7:8',
        'multiplication:8:6',
        'multiplication:9:7',
        'division:56:7',
        'division:56:8',
      ]),
    )
  })

  it('reverses only addition and multiplication', () => {
    expect(reversedCandidates('addition', 3, 5)).toHaveLength(1)
    expect(reversedCandidates('multiplication', 3, 5)).toHaveLength(1)
    expect(reversedCandidates('subtraction', 5, 3)).toEqual([])
    expect(reversedCandidates('division', 6, 3)).toEqual([])
  })

  it('builds fact families both ways', () => {
    const ops = (op: Parameters<typeof factFamilyCandidates>[0], a: number, b: number) =>
      factFamilyCandidates(op, a, b).map((c) => c.operation)
    expect(ops('multiplication', 8, 7)).toEqual(['division', 'division'])
    expect(ops('division', 56, 7)).toEqual(['multiplication', 'multiplication'])
    expect(ops('addition', 9, 6)).toEqual(['subtraction', 'subtraction'])
    expect(ops('subtraction', 15, 6)).toEqual(['addition', 'addition'])
  })

  it('never creates invalid subtraction or division and stays in the difficulty range', () => {
    for (const operation of ['addition', 'subtraction', 'multiplication', 'division'] as const) {
      for (const difficulty of ['beginner', 'easy', 'intermediate', 'advanced'] as const) {
        for (let i = 0; i < 50; i++) {
          const q = generateQuestion(operation, difficulty)
          const p = {
            ...pattern,
            operation,
            difficulty,
            operandA: q.operandA,
            operandB: q.operandB,
            patternKey: q.patternKey,
          }
          for (const c of similarCandidates(p)) {
            expect(isWithinDifficulty(c.operation, ...c.operands, difficulty)).toBe(true)
          }
          const similar = generateSimilarQuestion(p)
          expect(validateQuestion(similar)).toEqual([])
          expect(similar.source).toBe('mistake-review')
          expect(similar.mistakePatternId).toBe(p.id)
        }
      }
    }
  })

  it('avoids repeating the original question when other options exist', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateSimilarQuestion(pattern).patternKey).not.toBe('multiplication:8:7')
    }
  })
})
