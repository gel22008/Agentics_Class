import { useState } from 'react'
import { loadSettings } from '../services/practiceStore'
import type { AppSettings } from '../types'

/**
 * Current app settings, loaded from local storage (defaults if nothing is saved or the
 * saved data is invalid). Phase 11 adds editing and live updates.
 */
export function useSettings(): AppSettings {
  const [settings] = useState(loadSettings)
  return settings
}
