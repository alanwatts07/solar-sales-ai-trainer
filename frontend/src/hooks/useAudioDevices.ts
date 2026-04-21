import { useState, useCallback } from 'react'

export interface AudioDevice {
  deviceId: string
  label: string
}

export function useAudioDevices() {
  const [devices, setDevices] = useState<AudioDevice[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  // Enumerate without requesting permission -- labels may be blank until
  // permission is granted (that's fine, we get real labels after door knock)
  const enumerate = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = all
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          deviceId: d.deviceId,
          label: d.label || `Microphone ${i + 1}`,
        }))

      setDevices(audioInputs)
      if (!selectedDeviceId && audioInputs.length > 0) {
        setSelectedDeviceId(audioInputs[0].deviceId)
      }
    } catch {
      // enumerateDevices not supported
    }
  }, [selectedDeviceId])

  return { devices, selectedDeviceId, setSelectedDeviceId, enumerate }
}
