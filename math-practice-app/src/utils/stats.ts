/** Accuracy as a whole-number percentage. Returns 0 when nothing was attempted (no divide by zero). */
export function calculateAccuracy(correct: number, attempted: number): number {
  if (attempted <= 0) return 0
  return Math.round((correct / attempted) * 100)
}
