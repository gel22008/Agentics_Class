import type { AppSettings } from '../types'
import { DEFAULT_SETTINGS } from '../types'

/**
 * Current app settings. Returns the defaults for now; Phase 11 replaces this with
 * settings loaded from (and saved to) local storage.
 */
export function useSettings(): AppSettings {
  return DEFAULT_SETTINGS
}
