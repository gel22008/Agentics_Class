import { createContext, type RefObject } from 'react'

/** Return true to stop the navigation (e.g. to ask "end session or keep practicing?"). */
export type NavigationGuard = (to: string) => boolean

export const NavigationGuardContext = createContext<RefObject<NavigationGuard | null> | null>(null)
