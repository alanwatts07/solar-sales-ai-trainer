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
