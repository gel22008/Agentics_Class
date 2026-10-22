import type {
  AppSettings,
  MistakePattern,
  PracticeAttempt,
  PracticeSession,
  Question,
  SessionSummary,
} from '../types'
import { DEFAULT_SETTINGS } from '../types'
import {
  isAppSettings,
  isArrayOf,
  isMistakePattern,
  isPracticeAttempt,
  isSessionSummary,
} from '../utils/validation'
import { isValidPracticeConfig } from '../utils/session'
import { readJson, removeKey, STORAGE_KEYS, writeJson } from './storage'

/** Keep the newest records only so storage never grows without limit. */
export const MAX_STORED_SESSIONS = 100
export const MAX_STORED_ATTEMPTS = 5000

const isSessionList = isArrayOf(isSessionSummary)
const isAttemptList = isArrayOf(isPracticeAttempt)
const isMistakeList = isArrayOf(isMistakePattern)

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

// ---------- Mistake patterns ----------

export function loadMistakes(): MistakePattern[] {
  return readJson(STORAGE_KEYS.mistakes, isMistakeList, [])
}

export function saveMistakes(patterns: MistakePattern[]): boolean {
  return writeJson(STORAGE_KEYS.mistakes, patterns)
}

// ---------- Active session (restored after a refresh) ----------

export interface ActiveSessionRecord {
  /** Router location key of the session page, so a refresh restores the same session. */
  locationKey: string
  session: PracticeSession
  question: Question
}

function isActiveSessionRecord(value: unknown): value is ActiveSessionRecord {
  if (typeof value !== 'object' || value === null) return false
  const record = value as Record<string, unknown>
  const session = record.session as Record<string, unknown> | undefined
  const question = record.question as Record<string, unknown> | undefined
  return (
    typeof record.locationKey === 'string' &&
    typeof session?.id === 'string' &&
    session?.status === 'active' &&
    typeof session?.attemptedCount === 'number' &&
    Array.isArray(session?.operationsPracticed) &&
    isValidPracticeConfig(session?.config) &&
    typeof question?.id === 'string' &&
    Array.isArray(question?.choices) &&
    question.choices.length === 4
  )
}

export function loadActiveSession(): ActiveSessionRecord | null {
  return readJson<ActiveSessionRecord | null>(
    STORAGE_KEYS.activeSession,
    (value): value is ActiveSessionRecord | null => isActiveSessionRecord(value),
    null,
  )
}

export function saveActiveSession(record: ActiveSessionRecord): boolean {
  return writeJson(STORAGE_KEYS.activeSession, record)
}

export function clearActiveSession(): void {
  removeKey(STORAGE_KEYS.activeSession)
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
