import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'
import { isAppSettings } from '../utils/validation'
import {
  ensureSchemaVersion,
  onStorageProblem,
  readJson,
  SCHEMA_VERSION,
  STORAGE_KEYS,
  writeJson,
  type StorageProblem,
} from './storage'

function collectProblems() {
  const problems: StorageProblem[] = []
  const stop = onStorageProblem((p) => problems.push(p))
  return { problems, stop }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readJson / writeJson', () => {
  it('saves and loads data', () => {
    const settings: AppSettings = { ...DEFAULT_SETTINGS, masteryThreshold: 5 }
    expect(writeJson(STORAGE_KEYS.settings, settings)).toBe(true)
    expect(readJson(STORAGE_KEYS.settings, isAppSettings, DEFAULT_SETTINGS)).toEqual(settings)
  })

  it('returns the fallback when nothing is saved', () => {
    expect(readJson(STORAGE_KEYS.settings, isAppSettings, DEFAULT_SETTINGS)).toBe(DEFAULT_SETTINGS)
  })

  it('recovers from broken JSON and removes only that key', () => {
    const { problems, stop } = collectProblems()
    localStorage.setItem(STORAGE_KEYS.settings, '{not valid json')
    localStorage.setItem(STORAGE_KEYS.sessions, '[]')
    expect(readJson(STORAGE_KEYS.settings, isAppSettings, DEFAULT_SETTINGS)).toBe(DEFAULT_SETTINGS)
    expect(localStorage.getItem(STORAGE_KEYS.settings)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBe('[]')
    expect(problems).toEqual([{ kind: 'invalid-data', key: STORAGE_KEYS.settings }])
    stop()
  })

  it('rejects data with the wrong shape', () => {
    const { problems, stop } = collectProblems()
    localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify({ soundEffects: 'loud' }))
    expect(readJson(STORAGE_KEYS.settings, isAppSettings, DEFAULT_SETTINGS)).toBe(DEFAULT_SETTINGS)
    expect(problems[0].kind).toBe('invalid-data')
    stop()
  })

  it('reports (and does not crash) when storage is full', () => {
    const { problems, stop } = collectProblems()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
      if (key.endsWith('__probe__')) return
      throw new DOMException('full', 'QuotaExceededError')
    })
    expect(writeJson(STORAGE_KEYS.attempts, [1, 2, 3])).toBe(false)
    expect(problems[0].kind).toBe('full')
    stop()
  })

  it('reports (and does not crash) when storage is unavailable', () => {
    const { problems, stop } = collectProblems()
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(writeJson(STORAGE_KEYS.attempts, [])).toBe(false)
    expect(readJson(STORAGE_KEYS.settings, isAppSettings, DEFAULT_SETTINGS)).toBe(DEFAULT_SETTINGS)
    expect(problems.every((p) => p.kind === 'unavailable')).toBe(true)
    stop()
  })
})

describe('ensureSchemaVersion', () => {
  it('stores the current version for new users', () => {
    ensureSchemaVersion()
    expect(localStorage.getItem(STORAGE_KEYS.schemaVersion)).toBe(String(SCHEMA_VERSION))
  })

  it('upgrades a missing version without deleting existing or unrelated data', () => {
    localStorage.setItem(STORAGE_KEYS.sessions, '[]')
    localStorage.setItem('someOtherApp.data', 'keep me')
    ensureSchemaVersion()
    expect(localStorage.getItem(STORAGE_KEYS.schemaVersion)).toBe(String(SCHEMA_VERSION))
    expect(localStorage.getItem(STORAGE_KEYS.sessions)).toBe('[]')
    expect(localStorage.getItem('someOtherApp.data')).toBe('keep me')
  })
})
