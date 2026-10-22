/** A source of random numbers in [0, 1). Defaults to Math.random; tests can pass their own. */
export type RandomSource = () => number

/** Random whole number between min and max, both included. */
export function randomInt(min: number, max: number, random: RandomSource = Math.random): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new Error(`randomInt needs whole numbers, got ${min} and ${max}`)
  }
  if (min > max) {
    throw new Error(`randomInt min (${min}) cannot be greater than max (${max})`)
  }
  return min + Math.floor(random() * (max - min + 1))
}

/** Returns a new array in random order (Fisher–Yates). The original array is not changed. */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** Picks one random item from a non-empty array. */
export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T {
  if (items.length === 0) {
    throw new Error('pickRandom needs at least one item')
  }
  return items[Math.floor(random() * items.length)]
}

let idCounter = 0

/** Unique ID for questions, attempts, sessions and mistake patterns. */
export function createId(prefix = 'id'): string {
  idCounter += 1
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID()}`
  }
  return `${prefix}_${Date.now().toString(36)}_${idCounter.toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`
}
