import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { SettingsContext } from '../hooks/settingsContext'
import { loadSettings, saveSettings } from '../services/practiceStore'
import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

/** Loads settings once and shares them with every page; changes are saved automatically. */
function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(loadSettings)

  const updateSettings = useCallback((changes: Partial<AppSettings>) => {
    setSettings((previous) => {
      const next = { ...previous, ...changes }
      saveSettings(next)
      return next
    })
  }, [])

  const resetSettingsToDefaults = useCallback(() => setSettings(DEFAULT_SETTINGS), [])

  const value = useMemo(
    () => ({ settings, updateSettings, resetSettingsToDefaults }),
    [settings, updateSettings, resetSettingsToDefaults],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export default SettingsProvider
