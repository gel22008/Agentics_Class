/**
 * Safe wrapper around localStorage. Never throws: problems are reported through
 * results and a listener so the UI can show a friendly warning instead of crashing.
 */

export const STORAGE_PREFIX = 'mathPractice'
export const SCHEMA_VERSION = 1

export const STORAGE_KEYS = {
  schemaVersion: `${STORAGE_PREFIX}.schemaVersion`,
  settings: `${STORAGE_PREFIX}.settings`,
  sessions: `${STORAGE_PREFIX}.sessions`,
  attempts: `${STORAGE_PREFIX}.attempts`,
  mistakes: `${STORAGE_PREFIX}.mistakes`,
  activeSession: `${STORAGE_PREFIX}.activeSession`,
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export type StorageErrorKind = 'unavailable' | 'full' | 'invalid-data' | 'unknown'

export interface StorageProblem {
  kind: StorageErrorKind
  key?: string
}

type Listener = (problem: StorageProblem) => void
const listeners = new Set<Listener>()

/** Lets the UI react to storage problems (e.g. show a warning banner). */
export function onStorageProblem(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function report(problem: StorageProblem) {
  if (import.meta.env.DEV) console.warn('Storage problem:', problem)
  listeners.forEach((listener) => listener(problem))
}

function getStorage(): Storage | null {
  try {
    const storage = window.localStorage
    const probe = `${STORAGE_PREFIX}.__probe__`
    storage.setItem(probe, '1')
    storage.removeItem(probe)
    return storage
  } catch {
    return null
  }
}

export function isStorageAvailable(): boolean {
  return getStorage() !== null
}

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' ||
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      error.code === 22 ||
      error.code === 1014)
  )
}

/**
 * Reads and validates JSON. Returns the fallback when the value is missing, unreadable or
 * invalid. Invalid data is removed so only that one category is reset.
 */
export function readJson<T>(
  key: StorageKey,
  isValid: (value: unknown) => value is T,
  fallback: T,
): T {
  const storage = getStorage()
  if (!storage) {
    report({ kind: 'unavailable', key })
    return fallback
  }
  let raw: string | null
  try {
    raw = storage.getItem(key)
  } catch {
    report({ kind: 'unavailable', key })
    return fallback
  }
  if (raw === null) return fallback

  try {
    const parsed: unknown = JSON.parse(raw)
    if (isValid(parsed)) return parsed
  } catch {
    // fall through to the invalid-data handling below
  }
  report({ kind: 'invalid-data', key })
  try {
    storage.removeItem(key)
  } catch {
    // ignore
  }
  return fallback
}

/** Writes JSON. Returns true on success; reports and returns false on failure. */
export function writeJson(key: StorageKey, value: unknown): boolean {
  const storage = getStorage()
  if (!storage) {
    report({ kind: 'unavailable', key })
    return false
  }
  try {
    storage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    report({ kind: isQuotaError(error) ? 'full' : 'unknown', key })
    return false
  }
}

export function removeKey(key: StorageKey): void {
  try {
    getStorage()?.removeItem(key)
  } catch {
    // ignore
  }
}

type Migration = (storage: Storage) => void

/** Upgrades from version N-1 to N live here, keyed by the target version. */
const MIGRATIONS: Record<number, Migration> = {
  // 2: (storage) => { ... }  // example for a future change
}

/**
 * Ensures the stored schema version is current. Only touches this app's own keys,
 * so other data in the browser is never deleted.
 */
export function ensureSchemaVersion(): void {
  const storage = getStorage()
  if (!storage) return
  try {
    const stored = Number(storage.getItem(STORAGE_KEYS.schemaVersion))
    let version = Number.isInteger(stored) && stored > 0 ? stored : 0
    if (version === 0) {
      // Missing version: either a brand-new user or data from before versioning; treat as v1.
      version = 1
    }
    while (version < SCHEMA_VERSION) {
      MIGRATIONS[version + 1]?.(storage)
      version += 1
    }
    storage.setItem(STORAGE_KEYS.schemaVersion, String(SCHEMA_VERSION))
  } catch (error) {
    report({ kind: isQuotaError(error) ? 'full' : 'unknown', key: STORAGE_KEYS.schemaVersion })
  }
}
