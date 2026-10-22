import { activePatterns } from './mistakes'
import { loadAttempts, loadMistakes } from './practiceStore'

export const NOT_STARTED_REASON = "Disabled because you haven't started yet."
export const NO_MISTAKES_REASON = 'Disabled because you have no mistakes to review!'

/** Whether Practice Mistakes can be used right now, and why not if it can't. */
export function mistakeReviewAvailability() {
  const active = activePatterns(loadMistakes())
  const hasPracticed = loadAttempts().length > 0
  const reason = !hasPracticed ? NOT_STARTED_REASON : active.length === 0 ? NO_MISTAKES_REASON : ''
  return { available: active.length > 0, reason, active }
}
