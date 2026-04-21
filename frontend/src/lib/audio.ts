/**
 * Play a synthesized knock sound using Web Audio API.
 */
export function playKnockSound(): Promise<void> {
  return new Promise((resolve) => {
    const ctx = new AudioContext()
    const playKnock = (time: number) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.frequency.value = 120
      osc.type = 'sine'
      gain.gain.setValueAtTime(0.5, time)
      gain.gain.exponentialRampToValueAtTime(0.01, time + 0.12)
      osc.start(time)
      osc.stop(time + 0.12)
      // Add a click/tap noise
      const noise = ctx.createOscillator()
      const noiseGain = ctx.createGain()
      noise.connect(noiseGain)
      noiseGain.connect(ctx.destination)
      noise.frequency.value = 800
      noise.type = 'square'
      noiseGain.gain.setValueAtTime(0.15, time)
      noiseGain.gain.exponentialRampToValueAtTime(0.01, time + 0.05)
      noise.start(time)
      noise.stop(time + 0.05)
    }
    const now = ctx.currentTime
    playKnock(now)
    playKnock(now + 0.25)
    setTimeout(() => {
      ctx.close()
      resolve()
    }, 600)
  })
}

/**
 * Play audio from a base64-encoded mp3 string (ElevenLabs response).
 * Returns a promise that resolves when playback finishes.
 */
export function playBase64Audio(base64: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const audio = new Audio(`data:audio/mpeg;base64,${base64}`)
    audio.onended = () => resolve()
    audio.onerror = () => reject(new Error('Audio playback failed'))
    audio.play()
  })
}

/**
 * Speak text using the browser's built-in Web Speech Synthesis API.
 * Returns a promise that resolves when speech finishes.
 */
export function speakBrowser(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      console.warn('Web Speech Synthesis not supported')
      resolve()
      return
    }
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 1.0
    utterance.pitch = 1.0
    utterance.onend = () => resolve()
    utterance.onerror = () => resolve() // Don't block on errors
    window.speechSynthesis.speak(utterance)
  })
}

/**
 * Play AI response audio: ElevenLabs if available, browser TTS fallback.
 */
export async function playResponse(text: string, audioBase64: string | null): Promise<void> {
  if (audioBase64) {
    await playBase64Audio(audioBase64)
  } else {
    await speakBrowser(text)
  }
}
