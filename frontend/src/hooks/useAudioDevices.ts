import { useState, useEffect, useCallback } from 'react'

export interface AudioDevice {
  deviceId: string
  label: string
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  const enumerate = useCallback(async () => {
    // Need to request mic permission first to get device labels
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach((t) => t.stop())
    } catch {
      // Permission denied - we'll still try to enumerate
    }

    const all = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = all
      .filter((d) => d.kind === 'audioinput')
      .map((d, i) => ({
        deviceId: d.deviceId,
        label: d.label || `Microphone ${i + 1}`,
      }))

    setDevices(audioInputs)
    // Auto-select first device if none selected
    if (!selectedDeviceId && audioInputs.length > 0) {
      setSelectedDeviceId(audioInputs[0].deviceId)
    }
  }, [selectedDeviceId])

  useEffect(() => {
    enumerate()
    // Re-enumerate when devices change (e.g. plugging in a headset)
    navigator.mediaDevices.addEventListener('devicechange', enumerate)
    return () => navigator.mediaDevices.removeEventListener('devicechange', enumerate)
  }, [enumerate])

  return { devices, selectedDeviceId, setSelectedDeviceId }
}
