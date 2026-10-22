/** Very small sound effects made with the Web Audio API (no audio files to download). */
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    audioContext ??= new Ctor()
    return audioContext
  } catch {
    return null
  }
}

/** A short friendly chime: rising for "right", soft and low for "wrong" (never harsh). */
export function playFeedbackSound(kind: 'right' | 'wrong'): void {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    const notes = kind === 'right' ? [523.25, 783.99] : [392, 329.63]
    notes.forEach((frequency, index) => {
      const start = ctx.currentTime + index * 0.12
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()
      oscillator.type = 'sine'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, start)
      gain.gain.exponentialRampToValueAtTime(0.15, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.25)
      oscillator.connect(gain).connect(ctx.destination)
      oscillator.start(start)
      oscillator.stop(start + 0.3)
    })
  } catch {
    // Sound is optional; ignore any audio errors.
  }
}
