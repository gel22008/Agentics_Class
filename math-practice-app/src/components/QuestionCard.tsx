import { useEffect, useRef, useState } from 'react'
import type { Question } from '../types'
import AnswerChoice from './AnswerChoice'

export interface CardResult {
  selectedAnswer: number
  selfReportedCorrect: boolean
}

interface QuestionCardProps {
  question: Question
  questionNumber: number
  /** null for continuous practice. */
  totalQuestions: number | null
  animate: boolean
  showExplanation: boolean
  onResult: (result: CardResult) => void
}

export const RECHECK_MESSAGE = 'Try to recheck if these two are the same.'
export const MATCHES_MESSAGE =
  'Look again: your answer matches the correct answer, so you got it right!'

/**
 * 'recheck-wrong': said "right" but the answers don't match (red).
 * 'recheck-right': said "wrong" but the answers match (green).
 */
type Nudge = 'recheck-wrong' | 'recheck-right' | null

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

/** Shortcuts must not change the answer hidden behind an open dialog. */
const isDialogOpen = () => document.querySelector('[aria-modal="true"]') !== null

/**
 * A flashcard: pick an answer on the front, flip it, then say whether you got it right.
 * The parent should give it key={question.id} so all state resets for each new question.
 */
function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  animate,
  showExplanation,
  onResult,
}: QuestionCardProps) {
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isCardFlipped, setIsCardFlipped] = useState(false)
  const [nudge, setNudge] = useState<Nudge>(null)
  const [resultSent, setResultSent] = useState(false)
  const backHeadingRef = useRef<HTMLHeadingElement>(null)

  const answeredCorrectly = selectedAnswer === question.correctAnswer
  const progressLabel =
    totalQuestions === null
      ? `Question ${questionNumber}`
      : `Question ${questionNumber} of ${totalQuestions}`

  // Keyboard shortcut: number keys 1–4 pick an answer before the card is flipped.
  useEffect(() => {
    if (isCardFlipped) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        isTypingTarget(event.target) ||
        isDialogOpen()
      )
        return
      const index = Number(event.key) - 1
      if (Number.isInteger(index) && index >= 0 && index < question.choices.length) {
        event.preventDefault()
        setSelectedAnswer(question.choices[index])
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isCardFlipped, question.choices])

  // Move focus to the back of the card after flipping so screen readers read it.
  useEffect(() => {
    if (isCardFlipped) backHeadingRef.current?.focus()
  }, [isCardFlipped])

  const flip = () => {
    if (selectedAnswer !== null) setIsCardFlipped(true)
  }

  const report = (selfReportedCorrect: boolean) => {
    if (resultSent || selectedAnswer === null) return
    // Gentle nudges, shown once each: the child can always tap again to keep their choice.
    if (selfReportedCorrect && !answeredCorrectly && nudge !== 'recheck-wrong') {
      setNudge('recheck-wrong')
      return
    }
    if (!selfReportedCorrect && answeredCorrectly && nudge !== 'recheck-right') {
      setNudge('recheck-right')
      return
    }
    setResultSent(true)
    onResult({ selectedAnswer, selfReportedCorrect })
  }

  const cardClasses = [
    'flip-card',
    animate ? 'flip-card--animated' : 'flip-card--static',
    isCardFlipped && 'flip-card--flipped',
    nudge === 'recheck-wrong' && 'flip-card--recheck',
    nudge === 'recheck-right' && 'flip-card--matches',
  ]
    .filter(Boolean)
    .join(' ')

  // Read aloud by screen readers: the new question, then the revealed answer after flipping.
  const announcement = isCardFlipped
    ? `The correct answer is ${question.correctAnswer}. You chose ${selectedAnswer}.`
    : `${progressLabel}: ${question.displayText}`

  return (
    <div className={cardClasses}>
      <p className="visually-hidden" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      <div className="flip-card__inner">
        {/* ---------- Front ---------- */}
        <section
          className="flip-card__face flip-card__face--front"
          aria-label="Question card"
          aria-hidden={isCardFlipped}
          inert={isCardFlipped}
        >
          <p className="card__count">{progressLabel}</p>
          <h2 className="card__problem">
            {question.displayText} <span aria-hidden="true">= ?</span>
          </h2>
          <div className="answer-grid" role="group" aria-label="Answer choices">
            {question.choices.map((choice, index) => (
              <AnswerChoice
                key={choice}
                value={choice}
                position={index + 1}
                isSelected={choice === selectedAnswer}
                isLocked={isCardFlipped}
                onSelect={setSelectedAnswer}
              />
            ))}
          </div>
          <p className="card__hint">
            {selectedAnswer === null
              ? 'Pick an answer (tip: press 1, 2, 3 or 4).'
              : 'You can still change your answer before flipping.'}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--large flip-button"
            onClick={flip}
            disabled={selectedAnswer === null}
          >
            <span className="flip-button__icon" aria-hidden="true">
              ↻
            </span>
            Flip Card
          </button>
        </section>

        {/* ---------- Back ---------- */}
        <section
          className="flip-card__face flip-card__face--back"
          aria-label="Answer card"
          aria-hidden={!isCardFlipped}
          inert={!isCardFlipped}
        >
          <p className="card__count">{progressLabel}</p>
          <h2 className="card__problem" ref={backHeadingRef} tabIndex={-1}>
            {question.displayText}
          </h2>

          <dl className="answer-compare">
            <div
              className={`answer-compare__row${
                nudge === 'recheck-wrong'
                  ? ' answer-compare__row--recheck'
                  : nudge === 'recheck-right'
                    ? ' answer-compare__row--matches'
                    : ''
              }`}
            >
              <dt>Your answer</dt>
              <dd>
                {selectedAnswer}
                {nudge === 'recheck-wrong' && (
                  <span className="answer-compare__x" aria-hidden="true">
                    {' '}
                    ✗
                  </span>
                )}
                {nudge === 'recheck-right' && (
                  <span className="answer-compare__check" aria-hidden="true">
                    {' '}
                    ✅
                  </span>
                )}
              </dd>
            </div>
            <div className="answer-compare__row answer-compare__row--correct">
              <dt>Correct answer</dt>
              <dd>{question.correctAnswer}</dd>
            </div>
          </dl>

          {showExplanation && <p className="card__explanation">{question.explanation}</p>}

          {nudge === 'recheck-right' && (
            <p className="card__matches" role="alert">
              <span aria-hidden="true">✅ </span>
              {MATCHES_MESSAGE} If you still want to choose “I Got It Wrong”, tap it again.
            </p>
          )}

          {nudge === 'recheck-wrong' && (
            <p className="card__recheck" role="alert">
              <span aria-hidden="true">✗ </span>
              {RECHECK_MESSAGE} If you still think you got it right, tap “I Got It Right” again.
            </p>
          )}

          <p className="card__question-prompt">Did you get it right?</p>
          <div className="self-report">
            <button
              type="button"
              className="btn self-report__btn self-report__btn--right"
              onClick={() => report(true)}
              disabled={resultSent}
            >
              <span aria-hidden="true">👍</span> I Got It Right
            </button>
            <button
              type="button"
              className="btn self-report__btn self-report__btn--wrong"
              onClick={() => report(false)}
              disabled={resultSent}
            >
              <span aria-hidden="true">🔁</span> I Got It Wrong
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default QuestionCard
