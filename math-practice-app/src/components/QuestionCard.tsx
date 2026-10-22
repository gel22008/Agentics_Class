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

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName))

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
  const [showRecheck, setShowRecheck] = useState(false)
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
      if (event.altKey || event.ctrlKey || event.metaKey || isTypingTarget(event.target)) return
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
    // Gentle nudge: if the child says "right" but the answers don't match, ask once to recheck.
    if (selfReportedCorrect && !answeredCorrectly && !showRecheck) {
      setShowRecheck(true)
      return
    }
    setResultSent(true)
    onResult({ selectedAnswer, selfReportedCorrect })
  }

  const cardClasses = [
    'flip-card',
    animate ? 'flip-card--animated' : 'flip-card--static',
    isCardFlipped && 'flip-card--flipped',
    showRecheck && 'flip-card--recheck',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={cardClasses}>
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
              className={`answer-compare__row${showRecheck ? ' answer-compare__row--recheck' : ''}`}
            >
              <dt>Your answer</dt>
              <dd>
                {selectedAnswer}
                {showRecheck && (
                  <span className="answer-compare__x" aria-hidden="true">
                    {' '}
                    ✗
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

          {showRecheck && (
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
