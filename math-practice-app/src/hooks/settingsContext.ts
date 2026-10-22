import { createContext } from 'react'
import type { AppSettings } from '../types'

export interface SettingsContextValue {
  settings: AppSettings
  /** Saves new settings and applies them everywhere. */
  updateSettings: (changes: Partial<AppSettings>) => void
  /** Puts settings back to defaults in memory (used after Clear All Data). */
  resetSettingsToDefaults: () => void
}

export const SettingsContext = createContext<SettingsContextValue | null>(null)
