import { useContext, useState } from 'react'
import { loadSettings, saveSettings } from '../services/practiceStore'
import type { AppSettings } from '../types'
import { SettingsContext } from './settingsContext'

/** Current settings. Works with or without the provider (pages rendered alone in tests). */
export function useSettings(): AppSettings {
  const context = useContext(SettingsContext)
  const [fallback] = useState(loadSettings)
  return context?.settings ?? fallback
}

/** Settings plus functions to change them. */
export function useSettingsControls() {
  const context = useContext(SettingsContext)
  const [fallback, setFallback] = useState(loadSettings)
  if (context) return context
  return {
    settings: fallback,
    updateSettings: (changes: Partial<AppSettings>) => {
      const next = { ...fallback, ...changes }
      saveSettings(next)
      setFallback(next)
    },
    resetSettingsToDefaults: () => setFallback(loadSettings()),
  }
}
