import { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import ProgressBar from '../components/ProgressBar'
import QuestionCard, { type CardResult } from '../components/QuestionCard'
import { useSettings } from '../hooks/useSettings'
import { ROUTES } from '../routes'
import { saveAttempt, saveSession } from '../services/practiceStore'
import { generateQuestionForOperations } from '../services/questionGenerator'
import type { PracticeAttempt, PracticeConfig, PracticeSession, Question } from '../types'
import { pickFeedback } from '../utils/feedback'
import {
  buildAttempt,
  createSession,
  finishSession,
  isSessionComplete,
  isValidPracticeConfig,
  recordResult,
  summarizeSession,
} from '../utils/session'

/** Pause between cards so the child can reset before the next problem. */
const TRANSITION_DELAY_MS = 900
const TRANSITION_DELAY_NO_ANIMATION_MS = 400

function PracticeSessionPage() {
  const location = useLocation()
  const config = (location.state as { config?: unknown } | null)?.config

  if (!isValidPracticeConfig(config)) {
    return (
      <Navigate
        to={ROUTES.practiceSetup}
        replace
        state={{ notice: 'Choose your practice options to start a session.' }}
      />
    )
  }
  // key: starting a new session from the same page (e.g. Practice Again) resets everything.
  return <PracticeSessionRunner key={location.key} config={config} />
}

function PracticeSessionRunner({ config }: { config: PracticeConfig }) {
  const navigate = useNavigate()
  const settings = useSettings()

  const [session, setSession] = useState<PracticeSession>(() => createSession(config))
  const [question, setQuestion] = useState<Question>(() =>
    generateQuestionForOperations(config.operations, config.difficulty),
  )
  const [feedback, setFeedback] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)

  const attemptsRef = useRef<PracticeAttempt[]>([])
  const recordedQuestionIds = useRef(new Set<string>())
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  const totalQuestions = config.sessionLength === 'continuous' ? null : config.sessionLength
  const delay = settings.cardAnimation ? TRANSITION_DELAY_MS : TRANSITION_DELAY_NO_ANIMATION_MS

  const goToSummary = (finished: PracticeSession) => {
    const summary = summarizeSession(finished)
    // Only sessions with at least one answer are worth keeping in history.
    if (summary.attempted > 0) saveSession(summary)
    navigate(ROUTES.practiceSummary, { state: { summary, attempts: attemptsRef.current } })
  }

  const handleResult = ({ selectedAnswer, selfReportedCorrect }: CardResult) => {
    // Never record the same question twice.
    if (recordedQuestionIds.current.has(question.id)) return
    recordedQuestionIds.current.add(question.id)

    const attempt = buildAttempt(session, question, selectedAnswer, selfReportedCorrect)
    attemptsRef.current = [...attemptsRef.current, attempt]
    saveAttempt(attempt)
    const updated = recordResult(session, question, selfReportedCorrect)
    const done = isSessionComplete(updated)
    const nextSession = done ? finishSession(updated, 'completed') : updated
    setSession(nextSession)
    if (settings.encouragingFeedback) {
      setFeedback((previous) => pickFeedback(selfReportedCorrect, previous))
    }
    setIsTransitioning(true)

    timerRef.current = window.setTimeout(() => {
      if (done) {
        goToSummary(nextSession)
        return
      }
      setQuestion(
        generateQuestionForOperations(config.operations, config.difficulty, {
          avoidPatternKey: question.patternKey,
        }),
      )
      setFeedback('')
      setIsTransitioning(false)
    }, delay)
  }

  const requestEnd = () => {
    if (session.attemptedCount === 0) {
      navigate(ROUTES.practiceSetup)
      return
    }
    setConfirmEndOpen(true)
  }

  const cancelEnd = useCallback(() => setConfirmEndOpen(false), [])

  const confirmEnd = () => {
    window.clearTimeout(timerRef.current)
    setConfirmEndOpen(false)
    goToSummary(finishSession(session, 'ended-early'))
  }

  return (
    <section className="session" aria-label="Practice session">
      <h1 className="visually-hidden">Practice</h1>
      <div className="session__top">
        <ProgressBar completed={session.attemptedCount} total={totalQuestions} />
        <button type="button" className="btn btn--secondary btn--small" onClick={requestEnd}>
          End Session
        </button>
      </div>

      <QuestionCard
        key={question.id}
        question={question}
        questionNumber={Math.min(
          session.currentQuestionIndex + (isTransitioning ? 0 : 1),
          totalQuestions ?? Infinity,
        )}
        totalQuestions={totalQuestions}
        animate={settings.cardAnimation}
        showExplanation={settings.showExplanations}
        onResult={handleResult}
      />

      <p className="session__feedback" role="status">
        {feedback}
      </p>

      <ConfirmDialog
        open={confirmEndOpen}
        title="End this session?"
        message={`You answered ${session.attemptedCount} ${
          session.attemptedCount === 1 ? 'question' : 'questions'
        }. Your results so far will be saved in your summary.`}
        confirmLabel="End and See Summary"
        cancelLabel="Keep Practicing"
        onConfirm={confirmEnd}
        onCancel={cancelEnd}
      />
    </section>
  )
}

export default PracticeSessionPage
