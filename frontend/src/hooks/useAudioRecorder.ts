import { useState, useRef, useCallback } from 'react'

export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [duration, setDuration] = useState(0)
  const [audioLevel, setAudioLevel] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const analyserRef = useRef<{
    analyser: AnalyserNode
    ctx: AudioContext
    rafId: number
  } | null>(null)

  const startRecording = useCallback(async (deviceId?: string) => {
    const constraints: MediaStreamConstraints = {
      audio: deviceId
        ? { deviceId: { exact: deviceId } }
        : true,
    }
    const stream = await navigator.mediaDevices.getUserMedia(constraints)

    // Set up audio level monitoring
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
      analyserRef.current!.rafId = requestAnimationFrame(updateLevel)
    }
    analyserRef.current = { analyser, ctx: audioCtx, rafId: requestAnimationFrame(updateLevel) }

    // Set up MediaRecorder
    const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : 'audio/webm'
    const mediaRecorder = new MediaRecorder(stream, { mimeType })
    mediaRecorderRef.current = mediaRecorder
    chunksRef.current = []
    setAudioBlob(null)
    setDuration(0)

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
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

    const start = Date.now()
    timerRef.current = setInterval(() => {
      setDuration(Math.floor((Date.now() - start) / 1000))
    }, 1000)
  }, [])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [])

  const reset = useCallback(() => {
    setAudioBlob(null)
    setDuration(0)
    setAudioLevel(0)
  }, [])

  return { isRecording, audioBlob, duration, audioLevel, startRecording, stopRecording, reset }
}
