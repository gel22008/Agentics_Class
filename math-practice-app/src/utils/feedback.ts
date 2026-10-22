import { pickRandom, type RandomSource } from './random'

export const POSITIVE_MESSAGES = [
  'Great job! 🌟',
  'You got it! 🎉',
  'Awesome work! 🚀',
  'Nice thinking! 💡',
  'Way to go! 🙌',
]

export const SUPPORTIVE_MESSAGES = [
  "Nice try! Let's keep going. 💪",
  'Mistakes help us learn! 🌱',
  "Good effort! You'll get the next one. ⭐",
  'Keep practicing, you are getting stronger! 🧠',
]

/** Picks a friendly message, avoiding the one shown last time so it doesn't feel repetitive. */
export function pickFeedback(
  wasCorrect: boolean,
  previous?: string,
  random: RandomSource = Math.random,
): string {
  const pool = wasCorrect ? POSITIVE_MESSAGES : SUPPORTIVE_MESSAGES
  const options = pool.filter((message) => message !== previous)
  return pickRandom(options.length > 0 ? options : pool, random)
}
