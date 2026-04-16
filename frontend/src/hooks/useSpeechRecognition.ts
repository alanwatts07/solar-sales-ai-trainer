import { useState, useRef, useCallback } from 'react'

// Browser Web Speech API types
interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionResultList {
  length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
  confidence: number
}

interface SpeechRecognitionInstance extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  start(): void
  stop(): void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

export function useSpeechRecognition() {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
  const fullTranscriptRef = useRef('')

  const isSupported =
    typeof window !== 'undefined' &&
    (!!window.SpeechRecognition || !!window.webkitSpeechRecognition)

  const startListening = useCallback(() => {
    if (!isSupported) return

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    fullTranscriptRef.current = ''
    setTranscript('')

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = ''
      let final = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          final += result[0].transcript
        } else {
          interim += result[0].transcript
        }
      }
      if (final) {
        fullTranscriptRef.current += final
      }
      setTranscript(fullTranscriptRef.current + interim)
    }

    recognition.onerror = (event: { error: string }) => {
      console.error('Speech recognition error:', event.error)
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.start()
    recognitionRef.current = recognition
    setIsListening(true)
  }, [isSupported])

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setIsListening(false)
    setTranscript(fullTranscriptRef.current)
  }, [])

  const reset = useCallback(() => {
    fullTranscriptRef.current = ''
    setTranscript('')
  }, [])

  return {
    transcript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    reset,
    finalTranscript: fullTranscriptRef.current,
  }
}
