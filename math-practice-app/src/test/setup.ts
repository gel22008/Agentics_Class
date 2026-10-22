import { configure } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// findBy*/waitFor give up after 1 second by default. The app pauses ~0.9 seconds between
// cards, so allow 3 seconds to avoid failures on slower computers.
configure({ asyncUtilTimeout: 3000 })

// Every test starts with empty browser storage.
beforeEach(() => {
  window.localStorage.clear()
})
