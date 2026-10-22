import type { AppSettings, PracticeAttempt, SessionSummary } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { isAppSettings, isArrayOf, isPracticeAttempt, isSessionSummary } from '../utils/validation'
import { readJson, removeKey, STORAGE_KEYS, writeJson } from './storage'

/** Keep the newest records only so storage never grows without limit. */
export const MAX_STORED_SESSIONS = 100
export const MAX_STORED_ATTEMPTS = 5000

const isSessionList = isArrayOf(isSessionSummary)
const isAttemptList = isArrayOf(isPracticeAttempt)

// ---------- Settings ----------

export function loadSettings(): AppSettings {
  return readJson(STORAGE_KEYS.settings, isAppSettings, DEFAULT_SETTINGS)
}

export function saveSettings(settings: AppSettings): boolean {
  return writeJson(STORAGE_KEYS.settings, settings)
}

// ---------- Sessions ----------

/** Finished sessions, newest first. */
export function loadSessions(): SessionSummary[] {
  const sessions = readJson(STORAGE_KEYS.sessions, isSessionList, [])
  return [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt))
}

/** Saves (or replaces) one finished session's summary. */
export function saveSession(summary: SessionSummary): boolean {
  const others = loadSessions().filter((s) => s.sessionId !== summary.sessionId)
  const next = [summary, ...others].slice(0, MAX_STORED_SESSIONS)
  return writeJson(STORAGE_KEYS.sessions, next)
}

// ---------- Attempts ----------

export function loadAttempts(): PracticeAttempt[] {
  return readJson(STORAGE_KEYS.attempts, isAttemptList, [])
}

export function saveAttempt(attempt: PracticeAttempt): boolean {
  const existing = loadAttempts()
  if (existing.some((a) => a.id === attempt.id)) return true // never store duplicates
  const next = [...existing, attempt].slice(-MAX_STORED_ATTEMPTS)
  return writeJson(STORAGE_KEYS.attempts, next)
}

// ---------- Clearing ----------

/** Reset Statistics: removes history and statistics but keeps settings. */
export function clearStatistics(): void {
  removeKey(STORAGE_KEYS.attempts)
  removeKey(STORAGE_KEYS.sessions)
  removeKey(STORAGE_KEYS.mistakes)
  removeKey(STORAGE_KEYS.activeSession)
}

/** Clear All Application Data: everything, including settings. */
export function clearAllData(): void {
  clearStatistics()
  removeKey(STORAGE_KEYS.settings)
}
