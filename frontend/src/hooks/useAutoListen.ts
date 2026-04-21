import { useState, useRef, useCallback, useEffect } from 'react'

const SILENCE_THRESHOLD = 12       // audio level below this = silence
const SILENCE_TIMEOUT_MS = 4000    // 4 seconds of silence before auto-submit
const SPEECH_MIN_DURATION_MS = 800 // minimum speech before we accept it
const SPEECH_START_THRESHOLD = 15  // level needed to start detecting speech

interface AutoListenState {
  isListening: boolean
  isSpeaking: boolean
  audioLevel: number
  silenceCountdown: number  // seconds remaining until auto-submit (0 = not counting)
  audioBlob: Blob | null
  error: string | null
}

export function useAutoListen() {
  const [state, setState] = useState<AutoListenState>({
    isListening: false,
    isSpeaking: false,
    audioLevel: 0,
    silenceCountdown: 0,
    audioBlob: null,
    error: null,
  })

  const streamRef = useRef<MediaStream | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const rafRef = useRef<number>(0)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const speechStartRef = useRef<number>(0)
  const silenceStartRef = useRef<number>(0)
  const hasSpeechRef = useRef(false)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Start listening (mic stays open)
  const startListening = useCallback(async (deviceId?: string) => {
    setState((s) => ({ ...s, error: null, audioBlob: null }))
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream

      const audioCtx = new AudioContext()
      audioCtxRef.current = audioCtx
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Set up recorder (but don't start yet -- starts on speech detection)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
          ? 'audio/mp4'
          : 'audio/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        if (blob.size > 1000 && hasSpeechRef.current) {
          setState((s) => ({ ...s, audioBlob: blob, isSpeaking: false }))
        } else {
          // Too short or no real speech -- restart listening
          setState((s) => ({ ...s, isSpeaking: false }))
          startRecording()
        }
      }
      recorderRef.current = recorder

      setState((s) => ({ ...s, isListening: true }))
      startMonitoring()
      startRecording()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setState((s) => ({ ...s, error: `Mic error: ${msg}` }))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const startRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === 'inactive') {
      chunksRef.current = []
      hasSpeechRef.current = false
      speechStartRef.current = 0
      silenceStartRef.current = 0
      recorderRef.current.start(250)
    }
  }, [])

  const startMonitoring = useCallback(() => {
    const dataArray = new Uint8Array(analyserRef.current!.frequencyBinCount)

    const tick = () => {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      const level = Math.round((avg / 255) * 100)

      const now = Date.now()
      const isSpeaking = level > SPEECH_START_THRESHOLD

      if (isSpeaking) {
        if (!hasSpeechRef.current) {
          hasSpeechRef.current = true
          speechStartRef.current = now
        }
        silenceStartRef.current = 0
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
        setState((s) => ({ ...s, audioLevel: level, isSpeaking: true, silenceCountdown: 0 }))
      } else if (hasSpeechRef.current) {
        // Was speaking, now silent
        const speechDuration = now - speechStartRef.current
        if (speechDuration < SPEECH_MIN_DURATION_MS) {
          // Too short, ignore
          setState((s) => ({ ...s, audioLevel: level }))
        } else {
          // Real speech happened, start silence timer
          if (!silenceStartRef.current) {
            silenceStartRef.current = now
            // Start countdown display
            setState((s) => ({ ...s, audioLevel: level, silenceCountdown: 4 }))
            countdownIntervalRef.current = setInterval(() => {
              const elapsed = Date.now() - silenceStartRef.current
              const remaining = Math.max(0, Math.ceil((SILENCE_TIMEOUT_MS - elapsed) / 1000))
              setState((s) => ({ ...s, silenceCountdown: remaining }))
            }, 500)
          }

          const silenceDuration = now - silenceStartRef.current
          if (silenceDuration >= SILENCE_TIMEOUT_MS) {
            // 4 seconds of silence -- auto-submit
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current)
              countdownIntervalRef.current = null
            }
            setState((s) => ({ ...s, silenceCountdown: 0 }))
            if (recorderRef.current?.state === 'recording') {
              recorderRef.current.stop()
            }
            return // Stop monitoring, will restart after processing
          } else {
            setState((s) => ({ ...s, audioLevel: level }))
          }
        }
      } else {
        setState((s) => ({ ...s, audioLevel: level }))
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [])

  // Stop everything
  const stopListening = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (recorderRef.current?.state === 'recording') {
      recorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach((t) => t.stop())
    audioCtxRef.current?.close()
    streamRef.current = null
    audioCtxRef.current = null
    analyserRef.current = null
    recorderRef.current = null
    setState({
      isListening: false,
      isSpeaking: false,
      audioLevel: 0,
      silenceCountdown: 0,
      audioBlob: null,
      error: null,
    })
  }, [])

  // Reset blob and restart recording for next turn
  const resetAndContinue = useCallback(() => {
    setState((s) => ({ ...s, audioBlob: null, isSpeaking: false, silenceCountdown: 0 }))
    hasSpeechRef.current = false
    speechStartRef.current = 0
    silenceStartRef.current = 0
    chunksRef.current = []
    if (recorderRef.current && recorderRef.current.state === 'inactive' && streamRef.current) {
      recorderRef.current.start(250)
      startMonitoring()
    }
  }, [startMonitoring])

  // Manual stop (override)
  const forceStop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
    if (recorderRef.current?.state === 'recording') {
      hasSpeechRef.current = true // Force accept even if short
      recorderRef.current.stop()
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      audioCtxRef.current?.close()
    }
  }, [])

  return {
    ...state,
    startListening,
    stopListening,
    resetAndContinue,
    forceStop,
  }
}
