import { useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import ConfirmDialog from '../components/ConfirmDialog'
import ProgressBar from '../components/ProgressBar'
import QuestionCard, { type CardResult } from '../components/QuestionCard'
import { NavigationGuardContext } from '../hooks/navigationGuard'
import { useSettings } from '../hooks/useSettings'
import { ROUTES } from '../routes'
import { activePatterns, applyAttemptToMistakes, pickPatternForReview } from '../services/mistakes'
import {
  clearActiveSession,
  loadActiveSession,
  loadMistakes,
  saveActiveSession,
  saveAttempt,
  saveMistakes,
  saveSession,
} from '../services/practiceStore'
import { generateSimilarQuestion } from '../services/similarQuestions'
import { generateQuestionForOperations } from '../services/questionGenerator'
import type { PracticeAttempt, PracticeConfig, PracticeSession, Question } from '../types'
import { pickFeedback } from '../utils/feedback'
import { playFeedbackSound } from '../utils/sound'
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
  return <PracticeSessionRunner key={location.key} locationKey={location.key} config={config} />
}

function PracticeSessionRunner({
  config,
  locationKey,
}: {
  config: PracticeConfig
  locationKey: string
}) {
  const navigate = useNavigate()
  const settings = useSettings()
  const guardRef = useContext(NavigationGuardContext)

  /** Next question: a similar question for a past mistake in review mode, otherwise a new one. */
  const nextQuestion = (previous?: Question): Question => {
    if (config.mode === 'mistake-review') {
      const patterns = loadMistakes()
      const active = activePatterns(patterns)
      // If everything got mastered mid-session, keep reviewing the same facts until the end.
      const pool = active.length > 0 ? active : patterns
      const pattern = pickPatternForReview(pool, settings.masteryThreshold, {
        avoidId: previous?.mistakePatternId,
      })
      if (pattern)
        return generateSimilarQuestion(pattern, { avoidPatternKey: previous?.patternKey })
    }
    return generateQuestionForOperations(config.operations, config.difficulty, {
      avoidPatternKey: previous?.patternKey,
    })
  }

  // After a page refresh, pick up the same session where the child left off.
  const [restored] = useState(() => {
    const saved = loadActiveSession()
    return saved?.locationKey === locationKey ? saved : null
  })
  const [session, setSession] = useState<PracticeSession>(
    () => restored?.session ?? createSession(config),
  )
  const [question, setQuestion] = useState<Question>(() => restored?.question ?? nextQuestion())
  const [leaveTarget, setLeaveTarget] = useState<string | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [confirmEndOpen, setConfirmEndOpen] = useState(false)

  const attemptsRef = useRef<PracticeAttempt[]>([])
  const recordedQuestionIds = useRef(new Set<string>())
  const timerRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(timerRef.current), [])

  // Remember the active session (and the card on screen) so a refresh can restore it.
  useEffect(() => {
    if (session.status === 'active' && !isTransitioning) {
      saveActiveSession({ locationKey, session, question })
    }
  }, [locationKey, session, question, isTransitioning])

  // Ask before leaving through the app's links while a session with answers is in progress.
  useEffect(() => {
    if (!guardRef) return
    guardRef.current = (to: string) => {
      if (session.status !== 'active' || session.attemptedCount === 0) return false
      setLeaveTarget(to)
      return true
    }
    return () => {
      guardRef.current = null
    }
  })

  const totalQuestions = config.sessionLength === 'continuous' ? null : config.sessionLength
  const delay = settings.cardAnimation ? TRANSITION_DELAY_MS : TRANSITION_DELAY_NO_ANIMATION_MS

  const goToSummary = (finished: PracticeSession) => {
    const summary = summarizeSession(finished)
    // Only sessions with at least one answer are worth keeping in history.
    if (summary.attempted > 0) saveSession(summary)
    clearActiveSession()
    navigate(ROUTES.practiceSummary, { state: { summary, attempts: attemptsRef.current } })
  }

  const handleResult = ({ selectedAnswer, selfReportedCorrect }: CardResult) => {
    // Never record the same question twice.
    if (recordedQuestionIds.current.has(question.id)) return
    recordedQuestionIds.current.add(question.id)

    const attempt = buildAttempt(session, question, selectedAnswer, selfReportedCorrect)
    attemptsRef.current = [...attemptsRef.current, attempt]
    saveAttempt(attempt)
    saveMistakes(applyAttemptToMistakes(loadMistakes(), attempt, settings.masteryThreshold))
    const updated = recordResult(session, question, selfReportedCorrect)
    const done = isSessionComplete(updated)
    const nextSession = done ? finishSession(updated, 'completed') : updated
    setSession(nextSession)
    // Save the session's running totals after every answer, so history always matches the
    // saved answers even if the child leaves, refreshes or closes the tab.
    saveSession(summarizeSession(nextSession))
    // Pick the next card now and remember it, so a refresh during the pause can't re-show
    // (and double count) the card that was just answered.
    const upcoming = done ? null : nextQuestion(question)
    if (upcoming) saveActiveSession({ locationKey, session: nextSession, question: upcoming })
    else clearActiveSession()
    if (settings.soundEffects) playFeedbackSound(selfReportedCorrect ? 'right' : 'wrong')
    if (settings.encouragingFeedback) {
      setFeedback((previous) => pickFeedback(selfReportedCorrect, previous))
    }
    setIsTransitioning(true)

    timerRef.current = window.setTimeout(() => {
      if (done) {
        goToSummary(nextSession)
        return
      }
      if (upcoming) setQuestion(upcoming)
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

  const closeLeave = useCallback(() => setLeaveTarget(null), [])

  /** "End session and save" from the leave prompt: finish early, save, then go where they clicked. */
  const confirmLeave = () => {
    if (!leaveTarget) return
    window.clearTimeout(timerRef.current)
    saveSession(summarizeSession(finishSession(session, 'ended-early')))
    clearActiveSession()
    if (guardRef) guardRef.current = null
    const target = leaveTarget
    setLeaveTarget(null)
    navigate(target)
  }

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

      <ConfirmDialog
        open={leaveTarget !== null}
        title="Leave this practice session?"
        message="You can end the session now and save your progress, or keep practicing to the end of this session."
        confirmLabel="End Session and Save"
        cancelLabel="Keep Practicing"
        onConfirm={confirmLeave}
        onCancel={closeLeave}
      />
    </section>
  )
}

export default PracticeSessionPage
