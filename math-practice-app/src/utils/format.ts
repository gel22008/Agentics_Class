import type { SessionLength } from '../types'

export function sessionLengthLabel(length: SessionLength): string {
  return length === 'continuous' ? 'Keep going' : `${length} questions`
}
