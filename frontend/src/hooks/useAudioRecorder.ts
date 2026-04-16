import { useState, useRef, useCallback } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [permissionState, setPermissionState] = useState<string>('unknown')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<{
    analyser: AnalyserNode
    ctx: AudioContext
    rafId: number
  } | null>(null)

  // Check mic permission status
  const checkPermission = useCallback(async () => {
    try {
      if (navigator.permissions) {
        const result = await navigator.permissions.query({ name: 'microphone' as PermissionName })
        setPermissionState(result.state)
        return result.state
      }
    } catch {
      // permissions API not supported on this browser
    }
    setPermissionState('unknown')
    return 'unknown'
  }, [])

  // Request mic permission explicitly (call this from a button click)
  const requestPermission = useCallback(async (): Promise<boolean> => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setPermissionState('granted')
      return true
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Mic permission denied: ${msg}`)
      setPermissionState('denied')
      return false
    }
  }, [])

  const startRecording = useCallback(async (deviceId?: string) => {
    setError(null)
    try {
      const constraints: MediaStreamConstraints = {
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)

      // Audio level monitoring
      const audioCtx = new AudioContext()
      const source = audioCtx.createMediaStreamSource(stream)
      const analyser = audioCtx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      const dataArray = new Uint8Array(analyser.frequencyBinCount)

      const updateLevel = () => {
        analyser.getByteFrequencyData(dataArray)
        const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
        setAudioLevel(Math.round((avg / 255) * 100))
        if (analyserRef.current) {
          analyserRef.current.rafId = requestAnimationFrame(updateLevel)
        }
      }
      analyserRef.current = { analyser, ctx: audioCtx, rafId: requestAnimationFrame(updateLevel) }

      // MediaRecorder
      let mimeType = 'audio/webm'
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus'
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4'  // Safari/iOS
      }

      const mediaRecorder = new MediaRecorder(stream, { mimeType })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      setAudioBlob(null)
      setDuration(0)

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
        if (timerRef.current) clearInterval(timerRef.current)
        if (analyserRef.current) {
          cancelAnimationFrame(analyserRef.current.rafId)
          analyserRef.current.ctx.close()
          analyserRef.current = null
        }
        setAudioLevel(0)
      }

      mediaRecorder.start(250)
      setIsRecording(true)
      setPermissionState('granted')

      const start = Date.now()
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - start) / 1000))
      }, 1000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Mic error: ${msg}`)
      setIsRecording(false)
      if (msg.includes('Permission') || msg.includes('NotAllowed')) {
        setPermissionState('denied')
      }
    }
  }, [])

  const stopRecording = useCallback(() => {
    const mr = mediaRecorderRef.current
    if (!mr) {
      setError('No recorder to stop')
      return
    }
    if (mr.state === 'recording') {
      mr.stop()
      setIsRecording(false)
    } else {
      setError(`Recorder state: ${mr.state} (expected recording)`)
    }
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setAudioLevel(0)
    setError(null)
  }, [])

  return {
    isRecording,
    audioBlob,
    duration,
    audioLevel,
    error,
    permissionState,
    startRecording,
    stopRecording,
    reset,
    checkPermission,
    requestPermission,
  }
}
